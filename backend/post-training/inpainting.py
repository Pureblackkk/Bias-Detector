import torch
import argparse
from PIL import Image, ImageOps
from diffusers import StableDiffusionInpaintPipeline

def parse_option():
    parser = argparse.ArgumentParser()
    parser.add_argument('--device', type=str, default='cuda:2', help='device')
    args = parser.parse_known_args()[0]
    return args

args = parse_option()

pipe = StableDiffusionInpaintPipeline.from_pretrained(
    "/home/pureblackkkk/data/models/stable-diffusion-2-inpainting",
    torch_dtype=torch.float16,
)
pipe.to(args.device)

#image and mask_image should be PIL images.
#The mask structure is white for inpainting and black for keeping as is
def inpaint_image(
    img_path,
    mask_path,
    prompt,
    size,
):
    image = Image.open(img_path).resize((256, 256))

    original_mask = Image.open(mask_path).resize((256, 256)).convert('RGBA')

    image = pipe(
        prompt=prompt,
        image=image, 
        mask_image=original_mask,
        num_inference_steps=100
    ).images[0]

    image = image.resize(size, Image.LANCZOS)
    return image

if __name__ == '__main__':
    test_image_path = '/home/pureblackkkk/data/Bias-Detector/UrbanCars/train/country/0003_bg-country_co_occur_obj-country.jpg'
    test_mask_image = '/home/pureblackkkk/data/Bias-Detector/backend/static/phanoptic/train/country/0003_bg-country_co_occur_obj-country/car.png'
    test_prompt = 'a picture with ocean background'


    test_image = Image.open(test_image_path).resize((256, 256))

    test_mask = Image.open(test_mask_image).resize((256, 256)).convert('RGBA')
    alpha = test_mask.split()[3]

    new_test_mask = Image.new("L", test_mask.size, 255)
    new_test_mask.paste(0, mask=alpha)

    new_test_mask.save("output.png")


    image = pipe(
        prompt=test_prompt,
        image=test_image, 
        mask_image=new_test_mask,
        num_inference_steps=100
    ).images[0]

    image = image.resize((256, 256), Image.LANCZOS)
    image.save("./test.png")