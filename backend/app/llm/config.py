from groq import Groq
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

class LLMConfig:
    def __init__(
        self,
        model_name: str = "llama-3.1-8b-instant",
        temperature: float = 0.7,
        max_tokens: int = 1024
    ):
        # Load environment variables
        load_dotenv()
        
        # Get API key
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Initialize Groq client
        self.llm = ChatGroq(
            groq_api_key=self.api_key,
            model_name=model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )

# Example usage
if __name__ == "__main__":
    llm = LLMConfig() 