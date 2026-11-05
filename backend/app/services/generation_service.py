import os
import google.generativeai as genai
from PIL import Image
from io import BytesIO
import base64

class GeminiGenerationService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp-image-generation')

    async def text_to_image(self, prompt: str) -> bytes:
        response = self.model.generate_content(
            f"Generate an image: {prompt}",
            generation_config={"response_modalities": ["IMAGE"]}
        )
        for part in response.parts:
            if part.inline_data:
                return part.inline_data.data
        raise ValueError("No image generated")

    async def image_to_image(self, prompt: str, source_image_bytes: bytes) -> bytes:
        # Prepare source image for Gemini
        img = Image.open(BytesIO(source_image_bytes)).convert("RGB")
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_b64 = base64.b64encode(buffered.getvalue()).decode()

        response = self.model.generate_content([
            f"Edit this image: {prompt}",
            {"mime_type": "image/jpeg", "data": img_b64}
        ], generation_config={"response_modalities": ["IMAGE"]})

        for part in response.parts:
            if part.inline_data:
                return part.inline_data.data
        raise ValueError("No edited image generated")
