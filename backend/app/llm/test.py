from langchain_core.messages import HumanMessage
from PIL import Image
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
import base64
from io import BytesIO

load_dotenv()
# api_key = os.getenv("GROQ_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# Use raw string or forward slashes to avoid escape sequence issues
img_path = r"C:\Documents\studentBuddy\backend\app\llm\img.png"
img = Image.open(img_path)
print(img)

# Convert PIL Image to base64 string
buffer = BytesIO()
img.save(buffer, format='PNG')
img_base64 = base64.b64encode(buffer.getvalue()).decode()
img_data_url = f"data:image/png;base64,{img_base64}"

message = HumanMessage(
    content=[
        {"type": "text", "text": "solve the question"},
        {"type": "image_url", "image_url": {"url": img_data_url}}
    ]
)

response = llm.invoke([message])
print(response.content)
