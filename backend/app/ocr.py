import time
from langchain_core.messages import HumanMessage
from PIL import Image
from io import BytesIO
import fitz # PyMuPDF
from .llm.config import LLMConfig



class OCR(LLMConfig):
 
    def __init__(
        self,
        model_name: str = "gemini-2.5-flash",
        temperature: float = 0.2,
        max_tokens: int = 1024
    ):
        """
        Initialize OCR with LLM configuration.
        """
        super().__init__(
            model_name=model_name,
            temperature=temperature,
            max_tokens=max_tokens
        )
        self.finalResult = {}
 
    def extract_text(self, image_path: str) -> str:
        """
        Extract text from an image file using Gemini's OCR capability via LangChain.
 
        Args:
            image_path (str): The path to the image file.
 
        Returns:
            str: The extracted text.
        """
        try:
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                image_b64 = base64.b64encode(image_data).decode("utf-8")
            
            # Create a HumanMessage with a text part and an image part
            message = HumanMessage(
                content=[
                    {"type": "text", "text": "Extract all text from the image."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                ]
            )
            
            # Invoke the LLM with the multimodal message
            response = self.llm.invoke([message])
            return response.content
            
        except Exception as e:
            print(f"Error processing image: {e}")
            return ""
 
    def extract_text_from_file(self, file_path: str) -> str:
        """
        Extract text from a file (e.g., PDF) using OCR via LangChain.
 
        Args:
            file_path (str): The path to the PDF file.
 
        Returns:
            str: The extracted text.
        """
        try:
            doc = fitz.open(file_path)
            full_text = []
 
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                
                # Convert the page to an in-memory image
                image_bytes = pix.tobytes("png")
                image_b64 = base64.b64encode(image_bytes).decode("utf-8")
                
                # Create a HumanMessage with a text part and an in-memory image part
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": "Extract all text from this page."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
                    ]
                )
 
                # Invoke the LLM with the multimodal message
                response = self.llm.invoke([message])
                full_text.append(response.content)
            
            doc.close()
            return "\n\n".join(full_text)
 
        except Exception as e:
            print(f"An error occurred: {e}")
            return ""
        

# o = OCR(model_name="gemini-2.5-flash", temperature=0.1, max_tokens=1024)
# start_time = time.time()
# x = OCR.extract_text_from_file = o.extract_text_from_file("C:\\Documents\\studentBuddy\\backend\\app\\uploads\\R20_CSM_FINAL_SYLLABUS_6.0.pdf")
# end_time = time.time()
# print(x)
# print(f"Time taken: {end_time - start_time:.2f} seconds")