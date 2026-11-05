from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.deps import get_current_user
from app.models.user import User
from app.core.database import get_db
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import uuid
from io import BytesIO
from PIL import Image
import base64

router = APIRouter()

# Configure Gemini with your AI Studio key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use the correct model name for image generation
MODEL_NAME = "gemini-2.0-flash-exp-image-generation"

class TextToImageRequest(BaseModel):
    prompt: str
    num_images: int = 1

@router.post("/text-to-image")
async def text_to_image(
    req: TextToImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.credits < 5:
        raise HTTPException(403, "Need 5 credits")

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            f"Generate an image: {req.prompt}",
            generation_config={"response_modalities": ["IMAGE"]}
        )

        image_bytes = None
        for part in response.parts:
            if part.inline_data:
                image_bytes = part.inline_data.data
                break

        if not image_bytes:
            raise HTTPException(500, "No image generated")

        # Save image
        filename = f"generated/{current_user.id}/{uuid.uuid4()}.png"
        file_path = f"./storage/{filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        output_url = f"/storage/{filename}"
        current_user.credits -= 5
        db.commit()

        return {"success": True, "output_url": output_url, "credits_remaining": current_user.credits}

    except Exception as e:
        raise HTTPException(500, f"Generation failed: {str(e)}")


@router.post("/image-to-image")
async def image_to_image(
    file: UploadFile = File(...),
    prompt: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.credits < 5:
        raise HTTPException(403, "Need 5 credits")

    contents = await file.read()
    try:
        # Prepare the source image
        source_img = Image.open(BytesIO(contents)).convert("RGB")
        buffered = BytesIO()
        source_img.save(buffered, format="JPEG")
        img_b64 = base64.b64encode(buffered.getvalue()).decode()

        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            [
                f"Edit this image: {prompt}",
                {"mime_type": "image/jpeg", "data": img_b64}
            ],
            generation_config={"response_modalities": ["IMAGE"]}
        )

        image_bytes = None
        for part in response.parts:
            if part.inline_data:
                image_bytes = part.inline_data.data
                break

        if not image_bytes:
            raise HTTPException(500, "No edited image generated")

        filename = f"img2img/{current_user.id}/{uuid.uuid4()}.png"
        file_path = f"./storage/{filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        output_url = f"/storage/{filename}"
        current_user.credits -= 5
        db.commit()

        return {"success": True, "output_url": output_url, "credits_remaining": current_user.credits}

    except Exception as e:
        raise HTTPException(500, f"Image-to-image failed: {str(e)}")
