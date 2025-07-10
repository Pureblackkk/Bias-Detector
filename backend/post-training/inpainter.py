import numpy as np
from PIL import Image, ImageOps
from typing import List
import os
import sys
from inpainting import inpaint_image
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

FIXED_SIZE = (256, 256)

class Inpainer:
    def compose_image(
        self,
        inpainted_img,
        output_path,
        watermark_overlay_paths,
        upload_overlay_paths,
    ):
        composite = inpainted_img.convert("RGBA")

        # Compose upload image
        # TODO: maybe random set location
        for upload_path in upload_overlay_paths:
            upload_img = Image.open(upload_path).convert("RGBA").resize(FIXED_SIZE)
            composite = Image.alpha_composite(composite, upload_img)
    
        # Compose watermark
        for watermark_path in watermark_overlay_paths:
            watermark = Image.open(watermark_path).convert("RGBA").resize(FIXED_SIZE)
            composite = Image.alpha_composite(composite, watermark)

        print('save img at: ', output_path)
        composite.convert('RGB').save(output_path)

    def inpaint_image(
        self,
        img_path: str,
        masks_path: List[str],
        invert: bool,
        prompt: str,
        merged_mask_path: str,
    ):
        # Megre the mask alpha channel
        merged_alpha = np.zeros((256, 256))

        if masks_path and (len(masks_path) > 0):
            for mask_path in masks_path:
                mask = Image.open(mask_path).resize((256, 256))
                try:
                    alpha = np.array(mask.getchannel('A'))
                except Exception:
                    alpha = np.array(mask.convert("L"))

                merged_alpha = np.maximum(merged_alpha, alpha)
        
            # Create one merged mask
            binary_mask = np.where(merged_alpha > 0, 255, 0).astype(np.uint8)
            mask_image = Image.fromarray(binary_mask, 'L')

            if invert:
                mask_image = ImageOps.invert(mask_image)
            
            # Save the current mask as record
            mask_image.save(merged_mask_path)

            # Start inpainting
            img = inpaint_image(
                img_path=img_path,
                mask_path=merged_mask_path,
                prompt=prompt,
                size=FIXED_SIZE,
            )
            
            return img
        else:
            # No mask directly return the original img
            img = Image.open(img_path).resize((256, 256))
            return img