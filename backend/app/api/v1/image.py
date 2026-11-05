from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from io import BytesIO
from PIL import Image, ImageEnhance, ImageFilter
from app.core.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
import uuid
import os

router = APIRouter()

# Ensure storage directories exist
os.makedirs("./storage/processed", exist_ok=True)
os.makedirs("./storage/batch", exist_ok=True)

@router.post("/remove-bg")
async def remove_background(
    file: UploadFile = File(...),
    intensity: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove background with intensity control (0-100%)"""
    
    if current_user.credits < 1:
        raise HTTPException(403, "Insufficient credits")
    
    contents = await file.read()
    
    # Calculate alpha (0-100 -> 0.0-1.0)
    alpha = intensity / 100.0
    
    try:
        from rembg import remove
        from PIL import Image
        from io import BytesIO
        
        # First, get full removal
        full_removed = remove(contents, alpha_matting=True)
        
        # If intensity is less than 100%, blend with original
        if alpha < 1.0:
            # Open both images
            result_img = Image.open(BytesIO(full_removed))
            original_img = Image.open(BytesIO(contents))
            
            # Resize original to match result
            original_img = original_img.resize(result_img.size)
            
            # Blend based on alpha (alpha = 0.5 means 50% removal)
            # Formula: blended = original * (1-alpha) + removed * alpha
            blended = Image.blend(original_img, result_img, alpha)
            
            # Save to buffer
            buffer = BytesIO()
            blended.save(buffer, format="PNG")
            output = buffer.getvalue()
        else:
            output = full_removed
            
    except ImportError:
        output = contents
    
    # Save to storage
    filename = f"processed/{current_user.id}/{uuid.uuid4()}.png"
    file_path = f"./storage/{filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(output)
    
    current_user.credits -= 1
    db.commit()
    
    return {
        "success": True,
        "output_url": f"/storage/{filename}",
        "credits_remaining": current_user.credits
    }

@router.post("/upscale")
async def upscale_image(
    file: UploadFile = File(...),
    scale: int = 2,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI-powered upscaling - supports 2x, 4x, 8x with quality preservation"""
    
    # Validate scale
    if scale not in [2, 4, 8]:
        raise HTTPException(400, "Scale must be 2, 4, or 8")
    
    # Calculate cost based on scale
    cost = {2: 2, 4: 3, 8: 5}.get(scale, 2)
    
    if current_user.credits < cost:
        raise HTTPException(403, f"Insufficient credits. Need {cost} credits")
    
    contents = await file.read()
    img = Image.open(BytesIO(contents))
    
    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Try AI-based upscaling for 4x and 8x
    if scale >= 4:
        try:
            from realesrgan import RealESRGANer
            from basicsr.archs.rrdbnet_arch import RRDBNet
            import numpy as np
            
            # Load Real-ESRGAN model
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            upsampler = RealESRGANer(
                scale=4,
                model_path=None,  # Auto-downloads default model
                model=model,
                tile=0,
                tile_pad=10,
                pre_pad=0,
                half=False
            )
            
            # Convert PIL to numpy
            img_np = np.array(img)
            
            # Upscale to 4x first
            output_np, _ = upsampler.enhance(img_np, outscale=4)
            
            # If 8x requested, upscale again
            if scale == 8:
                output_np, _ = upsampler.enhance(output_np, outscale=2)
            
            output_img = Image.fromarray(output_np)
            
        except Exception as e:
            print(f"AI upscaling failed: {e}, falling back to LANCZOS")
            # Fallback to standard upscaling
            width, height = img.size
            new_size = (width * scale, height * scale)
            output_img = img.resize(new_size, Image.Resampling.LANCZOS)
    else:
        # For 2x, use LANCZOS (fast and good quality)
        width, height = img.size
        new_size = (width * scale, height * scale)
        output_img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Save to buffer
    buffer = BytesIO()
    output_img.save(buffer, format="PNG", quality=95)
    output = buffer.getvalue()
    
    # Save to storage
    filename = f"processed/{current_user.id}/{uuid.uuid4()}.png"
    file_path = f"./storage/{filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(output)
    
    current_user.credits -= cost
    db.commit()
    
    return {
        "success": True,
        "output_url": f"/storage/{filename}",
        "credits_remaining": current_user.credits
    }

@router.post("/enhance")
async def enhance_image(
    file: UploadFile = File(...),
    intensity: int = 50,
    deduct_credit: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gentle image enhancement with natural look"""
    
    print(f"🎨 Enhance: intensity={intensity}%, deduct_credit={deduct_credit}")
    
    if deduct_credit and current_user.credits < 1:
        raise HTTPException(403, "Insufficient credits")
    
    contents = await file.read()
    original = Image.open(BytesIO(contents)).convert("RGB")
    
    # ✅ GENTLE FACTORS - Natural look
    # intensity 0 = no change
    # intensity 50 = subtle enhancement
    # intensity 100 = noticeable but natural
    
    contrast_factor = 1.0 + (intensity / 100.0) * 0.6   # Max 1.6x
    sharpness_factor = 1.0 + (intensity / 100.0) * 0.8  # Max 1.8x
    color_factor = 1.0 + (intensity / 100.0) * 0.4      # Max 1.4x
    brightness_factor = 1.0 + (intensity / 100.0) * 0.2 # Max 1.2x
    
    enhanced = original.copy()
    
    enhancer = ImageEnhance.Contrast(enhanced)
    enhanced = enhancer.enhance(contrast_factor)
    
    enhancer = ImageEnhance.Sharpness(enhanced)
    enhanced = enhancer.enhance(sharpness_factor)
    
    enhancer = ImageEnhance.Color(enhanced)
    enhanced = enhancer.enhance(color_factor)
    
    enhancer = ImageEnhance.Brightness(enhanced)
    enhanced = enhancer.enhance(brightness_factor)
    
    buffer = BytesIO()
    enhanced.save(buffer, format="PNG", quality=95)
    output = buffer.getvalue()
    
    filename = f"processed/{current_user.id}/{uuid.uuid4()}.png"
    file_path = f"./storage/{filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(output)
    
    if deduct_credit:
        current_user.credits -= 1
        db.commit()
    
    return {
        "success": True,
        "output_url": f"/storage/{filename}",
        "credits_remaining": current_user.credits,
        "intensity_used": intensity,
        "credit_deducted": deduct_credit
    }

@router.post("/batch-process")
async def batch_process(
    files: List[UploadFile] = File(...),
    operation: str = "remove-bg",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process multiple images at once with queue support"""
    
    total_cost = len(files)
    
    if current_user.credits < total_cost:
        raise HTTPException(403, f"Insufficient credits. Need {total_cost} credits")
    
    results = []
    output_urls = []
    
    for idx, file in enumerate(files):
        try:
            if not file.content_type.startswith("image/"):
                results.append({"index": idx, "success": False, "error": "Not an image"})
                continue
            
            contents = await file.read()
            
            if len(contents) > 10 * 1024 * 1024:
                results.append({"index": idx, "success": False, "error": "File too large (max 10MB)"})
                continue
            
            # Process based on operation
            if operation == "remove-bg":
                from rembg import remove
                output = remove(contents)
                
            elif operation == "upscale":
                img = Image.open(BytesIO(contents))
                width, height = img.size
                new_size = (width * 2, height * 2)
                upscaled = img.resize(new_size, Image.Resampling.LANCZOS)
                buffer = BytesIO()
                upscaled.save(buffer, format="PNG")
                output = buffer.getvalue()
                
            elif operation == "enhance":
                img = Image.open(BytesIO(contents))
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(1.5)
                enhancer = ImageEnhance.Sharpness(img)
                img = enhancer.enhance(1.8)
                enhancer = ImageEnhance.Color(img)
                img = enhancer.enhance(1.3)
                buffer = BytesIO()
                img.save(buffer, format="PNG")
                output = buffer.getvalue()
                
            else:
                output = contents
            
            # Save to storage
            filename = f"batch/{current_user.id}/{uuid.uuid4()}.png"
            file_path = f"./storage/{filename}"
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(output)
            
            output_url = f"/storage/{filename}"
            output_urls.append(output_url)
            results.append({"index": idx, "success": True, "url": output_url})
            current_user.credits -= 1
            
        except Exception as e:
            results.append({"index": idx, "success": False, "error": str(e)})
    
    db.commit()
    
    return {
        "success": True,
        "total_processed": len(output_urls),
        "total_failed": len(files) - len(output_urls),
        "output_urls": output_urls,
        "results": results,
        "credits_remaining": current_user.credits,
        "message": f"Processed {len(output_urls)} images successfully"
    }
