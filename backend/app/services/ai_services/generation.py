import asyncio
import base64
from io import BytesIO
from typing import Optional, Literal
from PIL import Image
import torch
import requests
import json
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class ModelType(str, Enum):
    STABLE_DIFFUSION = "stable-diffusion"
    DALL_E = "dalle"
    SDXL = "sdxl"

class ImageGenerationService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.pipe = None
        
    async def generate_from_prompt(
        self,
        prompt: str,
        negative_prompt: Optional[str] = "bad quality, blurry, ugly, distorted",
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        num_images: int = 1,
        model: ModelType = ModelType.STABLE_DIFFUSION
    ) -> list:
        """
        Generate images from text prompt
        
        Args:
            prompt: Text description of image to generate
            negative_prompt: What to avoid in generation
            width: Image width (must be multiple of 64)
            height: Image height (must be multiple of 64)
            num_inference_steps: Quality vs speed (20-50)
            guidance_scale: How closely to follow prompt (1-20)
            num_images: Number of images to generate
            model: Which model to use
        
        Returns:
            List of image bytes
        """
        
        if model == ModelType.STABLE_DIFFUSION:
            return await self._generate_with_sd(
                prompt, negative_prompt, width, height, 
                num_inference_steps, guidance_scale, num_images
            )
        elif model == ModelType.DALL_E:
            return await self._generate_with_dalle(prompt, num_images)
        else:
            return await self._generate_with_sdxl(
                prompt, negative_prompt, width, height,
                num_inference_steps, guidance_scale, num_images
            )
    
    async def _generate_with_sd(self, prompt, negative_prompt, width, height, steps, scale, num_images):
        """Generate using Stable Diffusion (local)"""
        try:
            from diffusers import StableDiffusionPipeline
            
            # Load model on first use
            if self.pipe is None:
                self.pipe = StableDiffusionPipeline.from_pretrained(
                    "runwayml/stable-diffusion-v1-5",
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
                )
                self.pipe = self.pipe.to(self.device)
                self.pipe.safety_checker = None  # Disable safety checker for speed
                
                # Enable memory efficient attention
                if self.device == "cuda":
                    self.pipe.enable_attention_slicing()
            
            # Run generation in thread pool
            loop = asyncio.get_event_loop()
            images = await loop.run_in_executor(
                None,
                self._generate_sd_sync,
                prompt, negative_prompt, width, height, steps, scale, num_images
            )
            
            # Convert PIL images to bytes
            results = []
            for img in images:
                buffer = BytesIO()
                img.save(buffer, format="PNG")
                results.append(buffer.getvalue())
            
            return results
            
        except Exception as e:
            logger.error(f"SD generation failed: {str(e)}")
            raise
    
    def _generate_sd_sync(self, prompt, negative_prompt, width, height, steps, scale, num_images):
        """Synchronous SD generation"""
        with torch.no_grad():
            result = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                num_inference_steps=steps,
                guidance_scale=scale,
                num_images_per_prompt=num_images
            )
        return result.images
    
    async def _generate_with_dalle(self, prompt: str, num_images: int = 1):
        """Generate using DALL-E API"""
        import openai
        
        try:
            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = await client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=num_images
            )
            
            results = []
            for image_data in response.data:
                # Download image from URL
                img_response = await asyncio.get_event_loop().run_in_executor(
                    None, requests.get, image_data.url
                )
                results.append(img_response.content)
            
            return results
            
        except Exception as e:
            logger.error(f"DALL-E generation failed: {str(e)}")
            raise
    
    async def enhance_generated_image(
        self,
        image_bytes: bytes,
        upscale: bool = True,
        face_restore: bool = True,
        color_correct: bool = True
    ) -> bytes:
        """
        Enhance AI generated images with post-processing
        """
        from app.services.ai_services.upscale import upscale_service
        from app.services.ai_services.face_enhance import face_enhance_service
        
        result_bytes = image_bytes
        
        # Upscale for better quality
        if upscale:
            result_bytes = await upscale_service.upscale(result_bytes, scale=2)
        
        # Restore faces if present
        if face_restore:
            result_bytes = await face_enhance_service.enhance(result_bytes, strength=0.7)
        
        # Auto color correction
        if color_correct:
            result_bytes = await self._auto_color_correct(result_bytes)
        
        return result_bytes
    
    async def _auto_color_correct(self, image_bytes: bytes) -> bytes:
        """Automatic color correction for AI generated images"""
        from PIL import Image, ImageEnhance, ImageFilter
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._color_correct_sync,
            image_bytes
        )
        return result
    
    def _color_correct_sync(self, image_bytes: bytes) -> bytes:
        """Synchronous color correction"""
        img = Image.open(BytesIO(image_bytes))
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)
        
        # Enhance color
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.15)
        
        # Sharpen slightly
        img = img.filter(ImageFilter.UnsharpMask(radius=0.5, percent=50, threshold=0))
        
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()
    
    async def image_to_image(
        self,
        input_image: bytes,
        prompt: str,
        strength: float = 0.7,
        guidance_scale: float = 7.5
    ) -> bytes:
        """
        Generate new image based on input image + prompt
        (Img2Img - Transform existing image)
        """
        try:
            from diffusers import StableDiffusionImg2ImgPipeline
            
            # Load img2img pipeline
            if not hasattr(self, 'img2img_pipe'):
                self.img2img_pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
                    "runwayml/stable-diffusion-v1-5",
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
                )
                self.img2img_pipe = self.img2img_pipe.to(self.device)
            
            # Open input image
            init_image = Image.open(BytesIO(input_image)).convert("RGB")
            init_image = init_image.resize((512, 512))
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._img2img_sync,
                init_image, prompt, strength, guidance_scale
            )
            
            buffer = BytesIO()
            result.save(buffer, format="PNG")
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Img2Img failed: {str(e)}")
            raise
    
    def _img2img_sync(self, init_image, prompt, strength, guidance_scale):
        """Synchronous img2img generation"""
        with torch.no_grad():
            result = self.img2img_pipe(
                prompt=prompt,
                image=init_image,
                strength=strength,
                guidance_scale=guidance_scale
            )
        return result.images[0]

# Singleton instance
generation_service = ImageGenerationService()
