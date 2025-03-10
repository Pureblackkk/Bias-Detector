import torch
import sys
import os
sys.path.append(os.path.dirname(__file__))  
from diffusers.utils import load_image, check_min_version
from controlnet_flux import FluxControlNetModel
from transformer_flux import FluxTransformer2DModel
from pipeline_flux_controlnet_inpaint import FluxControlNetInpaintingPipeline

check_min_version("0.30.2")


# Build pipeline
controlnet = FluxControlNetModel.from_pretrained("/home/pureblackkkk/my_volume/models/FLUX.1-dev-Controlnet-Inpainting-Alpha", torch_dtype=torch.bfloat16)
transformer = FluxTransformer2DModel.from_pretrained(
    "black-forest-labs/FLUX.1-dev", subfolder='transformer', torch_dtype=torch.bfloat16
)
pipe = FluxControlNetInpaintingPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev",
    controlnet=controlnet,
    transformer=transformer,
    torch_dtype=torch.bfloat16
).to("cuda")
pipe.transformer.to(torch.bfloat16)
pipe.controlnet.to(torch.bfloat16)


def inpaint_image(
    img_path,
    merged_mask_path,
    prompt,
    output_path,
    seed=24,
    size=(256, 256), 
):
    image = load_image(img_path).convert("RGB").resize(size)
    mask = load_image(merged_mask_path).convert("RGB").resize(size)
    generator = torch.Generator(device="cuda").manual_seed(seed)

    result = pipe(
        prompt=prompt,
        height=size[1],
        width=size[0],
        control_image=image,
        control_mask=mask,
        num_inference_steps=28,
        generator=generator,
        controlnet_conditioning_scale=0.9,
        guidance_scale=3.5,
        negative_prompt="",
        true_guidance_scale=1.0 # default: 3.5 for alpha and 1.0 for beta
    ).images[0]
    
    result.save(output_path)
