from .config import LLMConfig
from langchain_core.messages import HumanMessage
from PIL import Image
import os
import base64
from io import BytesIO
class ImageExtraction(LLMConfig):
    
    def extractInfo(self, img_data_url, prompt):
        prompt += " The above is the query and try extract relevant information from the image for further processing by a Agent in the next step. Keep your respose clean and simple but with information that can help the Reasoning Agent answer the question"
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": img_data_url}}
            ]
        )
        response = self.llm.invoke([message])
        return response.content

    def processImage(self, img_path, prompt):
        img = Image.open(img_path)
        print(img)

        # Convert PIL Image to base64 string
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        img_data_url = f"data:image/png;base64,{img_base64}"
        return self.extractInfo(img_data_url, prompt)
    


