import re
import json 
import os
import random

BASE_FOLDER = '/home/pureblackkkk/data/Bias-Detector/backend/post-training/augmentations'
STATIC_ROOT_FOLDER = '/home/pureblackkkk/data/Bias-Detector/backend'

def create_solution_folder_by_uid(
    dataset,
    class_name,
    uid,
    solution_name,
):
    solution_path = os.path.join(
        BASE_FOLDER,
        uid,
        f'{dataset}-{class_name}',
        solution_name,
    )
    os.makedirs(solution_path, exist_ok=True)
    return solution_path

def create_inpaining_folder_for_image(
    solution_folder,
    img_name
):
    img_folder = os.path.join(solution_folder, img_name)
    os.makedirs(img_folder, exist_ok=True)

    return img_folder

def solve_manual_mask_path(
    uid,
    dataset,
    class_name,
    solution_name,
    img_path,
    keyword,
):
    manual_mask_path = os.path.join(
        BASE_FOLDER,
        uid,
        f'{dataset}-{class_name}',
        solution_name,
        solve_img_name_from_abs_path(img_path),
        f'{keyword}_segmentation.png',
    )

    return str(manual_mask_path)


def solve_img_name_from_abs_path(imgPath):
    return os.path.basename(imgPath).split('.')[0]


def get_built_in_dict(urbancars_json, waterbirds_json):
    with open(urbancars_json, "r", encoding="utf-8") as f1, open(waterbirds_json, "r", encoding="utf-8") as f2:
        res_dict = {
            'urbancars': json.load(f1),
            'waterbirds': json.load(f2)
        }
    return res_dict

def sample_solution_imgs(
    numbers,
    img_folder_path,
    panoptic_folder_path,
    dataset,
):
    built_in_segmentation_keywords = {
        'waterbirds': ['bird'],
        'urbancars': ['car', 'truck']
    }
    priority_keywords = built_in_segmentation_keywords[dataset]


    priority_image_name = []
    for image_name in os.listdir(panoptic_folder_path):
        image_folder_path = os.path.join(panoptic_folder_path, image_name)
        elements = set(os.listdir(image_folder_path))
        
        for e in elements:
            if e in priority_keywords:
                priority_image_name.append(image_name)
                break
    
    if numbers <= len(priority_image_name):
        # If the required num is smmaler than the length of priority_image_name
        sampled_imgs = random.sample(priority_image_name, numbers)
    else:
        sampled_imgs = priority_image_name
        
        # Select the remain ones
        remain_names = set(os.listdir(panoptic_folder_path)) - set(priority_image_name)
        remain_number = numbers - len(priority_image_name)

        sampled_imgs.extend(random.sample(list(remain_names), remain_number))

    # Create path for the imgs
    return [os.path.join(img_folder_path, f'{img_name}.jpg') for img_name in sampled_imgs]

def solve_path_for_static_file(path):
    return os.path.join(STATIC_ROOT_FOLDER, path)
