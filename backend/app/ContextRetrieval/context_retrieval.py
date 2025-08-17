from qdrant_client import QdrantClient, models
import google.generativeai as gemini_client
import os
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QdrantMemory:
    """
    A class to manage a Qdrant memory instance.
    This class is used to interact with a Qdrant database for storing and retrieving context.
    """

    def __init__(self, session_id: str, gemini_api_key: Optional[str] = None):
        self.client = QdrantClient(url=":memory:")
        self.collection_name = f"temp_collection_{session_id}"
        
        # Configure Gemini API
        api_key = gemini_api_key or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not provided. Using placeholder embeddings.")
            self.use_gemini = False
        else:
            gemini_client.configure(api_key=api_key)
            self.use_gemini = True
        
        self._create_collection()

    def _create_collection(self):
        """
        Create a collection in the Qdrant database if it does not already exist.
        """
        # Gemini embedding dimension is 768, fallback to 3 for placeholder
        vector_size = 768 if self.use_gemini else 3
        
        self.client.recreate_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(size=vector_size, distance=models.Distance.COSINE),
        )

    def upsert(self, points: List[models.PointStruct]):
        """
        Upsert points into the Qdrant collection.
        """
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Successfully upserted {len(points)} points to collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Error upserting points: {e}")
            raise

    def search(self, query_vector: List[float], limit: int = 5):
        """
        Search for similar points in the Qdrant collection.
        """
        try:
            return self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit
            )
        except Exception as e:
            logger.error(f"Error searching collection: {e}")
            raise
    
    def clear(self):
        """
        Clear the Qdrant collection.
        """
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"Successfully cleared collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Error clearing collection: {e}")
            raise

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts using Google Gemini embedding model.
        """
        if not self.use_gemini:
            # Fallback to placeholder embeddings
            logger.warning("Using placeholder embeddings. Set GEMINI_API_KEY for proper embeddings.")
            return [[0.0, 0.0, 0.0] for _ in texts]
        
        try:
            embeddings = []
            for text in texts:
                result = gemini_client.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document",
                    title="StudentBuddy Context"
                )
                embeddings.append(result['embedding'])
            
            logger.info(f"Generated embeddings for {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Fallback to placeholder embeddings if Gemini fails
            logger.warning("Falling back to placeholder embeddings due to Gemini API error")
            return [[0.0] * 768 for _ in texts]  # 768-dimensional zero vectors

    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a query text using Google Gemini embedding model.
        """
        if not self.use_gemini:
            logger.warning("Using placeholder query embedding. Set GEMINI_API_KEY for proper embeddings.")
            return [0.0, 0.0, 0.0]
        
        try:
            result = gemini_client.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query",
                title="StudentBuddy Query"
            )
            return result['embedding']
            
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            # Fallback to placeholder embedding if Gemini fails
            return [0.0] * 768  # 768-dimensional zero vector

    def add_context(self, texts: List[str], metadata: Optional[List[dict]] = None):
        """
        Add context texts to the vector database.
        
        Args:
            texts: List of text strings to add
            metadata: Optional list of metadata dictionaries for each text
        """
        if not texts:
            return
        
        # Generate embeddings
        embeddings = self.generate_embeddings(texts)
        
        # Create points
        points = []
        for i, (text, embedding) in enumerate(zip(texts, embeddings)):
            point_metadata = {
                "text": text,
                "index": i
            }
            
            # Add custom metadata if provided
            if metadata and i < len(metadata):
                point_metadata.update(metadata[i])
            
            points.append(
                models.PointStruct(
                    id=i,
                    vector=embedding,
                    payload=point_metadata
                )
            )
        
        # Upsert points
        self.upsert(points)

    def search_context(self, query: str, limit: int = 5) -> List[dict]:
        """
        Search for relevant context based on a query.
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            List of dictionaries containing matched texts and metadata
        """
        # Generate query embedding
        query_embedding = self.generate_query_embedding(query)
        
        # Search for similar points
        search_results = self.search(query_embedding, limit)
        
        # Format results
        context_results = []
        for result in search_results:
            context_results.append({
                "text": result.payload.get("text", ""),
                "score": result.score,
                "metadata": {k: v for k, v in result.payload.items() if k != "text"}
            })
        
        return context_results

    def get_relevant_context(self, query: str, max_context_length: int = 2000) -> str:
        """
        Get relevant context as a formatted string for use in prompts.
        
        Args:
            query: Search query string
            max_context_length: Maximum length of returned context
            
        Returns:
            Formatted context string
        """
        results = self.search_context(query, limit=10)
        
        if not results:
            return ""
        
        context_parts = []
        current_length = 0
        
        for result in results:
            text = result["text"]
            if current_length + len(text) > max_context_length:
                break
            
            context_parts.append(text)
            current_length += len(text)
        
        if context_parts:
            return "Relevant context:\n" + "\n".join(context_parts) + "\n\n"
        
        return ""
