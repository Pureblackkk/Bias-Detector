import os
from tqdm import tqdm
from utils import create_solution_folder_by_uid, create_inpaining_folder_for_image, solve_img_name_from_abs_path

class UserWorkFLow:
    def __init__(
        self,
        uid,
        keyword_processor,
        segmentor,
        inpainter,
    ):
        self.uid = uid
        self.keyword_processor = keyword_processor
        self.user_segmentor = segmentor
        self.inpainter = inpainter

    def inpainting_for_solution(
        self,
        dataset,
        label,
        solution_name,
        solution_imgs,
        panoptic_dict,
        invert,
        prompt,
        keyword_list,
        mask_path_list,
    ):
        print('****** Solve solution: ', solution_name)
        # Create requested folder (Solution + Image)
        solution_folder = create_solution_folder_by_uid(
            dataset=dataset,
            class_name=label,
            uid=self.uid,
            solution_name=solution_name,
        )

        # Create image folder
        for img_path in solution_imgs:
            create_inpaining_folder_for_image(
                solution_folder=solution_folder,
                img_name=solve_img_name_from_abs_path(img_path)
            )
        
        # Get grouped processor
        upload_overlay_masks, watermark_overlay_masks, draw_keyword_mask_pairs, manual_keywords, builtin_keywords = self.keyword_processor.group_keywords(
            dataset,
            label,
            keyword_list,
            mask_path_list,
        )

        print('******keyword_list', keyword_list)
        print('------watermark_overlay_masks', watermark_overlay_masks)
        print('------upload_overlay_masks', upload_overlay_masks)
        print('------draw_keyword_mask_pairs', draw_keyword_mask_pairs),
        print('------manual_keywords', manual_keywords),
        print('------built_in_keywords', builtin_keywords)

        # Segment image based on keywords
        img_mask_pair_list = self.user_segmentor.generate_segmentaion(
            dataset=dataset,
            class_name=label,
            solution_name=solution_name,
            solution_imgs=solution_imgs,
            panoptic_dict=panoptic_dict,
            draw_keyword_mask_pairs=draw_keyword_mask_pairs,
            manual_generate_keywords=manual_keywords,
            built_in_keywords=builtin_keywords,
        )

        # Inpaint for current solution
        for img_path, masks_path in tqdm(img_mask_pair_list):
            # If has built in keywords but no masks_path then skip the inpainting
            if len(masks_path) <= 0 and len(builtin_keywords) > 0:
                continue

            # Get the generated image_folder
            img_name = solve_img_name_from_abs_path(img_path)
            img_folder = create_inpaining_folder_for_image(
                solution_folder=solution_folder,
                img_name=img_name
            )

            merged_mask_path = os.path.join(
                img_folder,
                f'merged_mask.png'
            )

            output_img_path = os.path.join(
                img_folder,
                f'inpainting.jpg'
            )

            # Using mask for inpainting
            img = self.inpainter.inpaint_image(
                img_path=img_path,
                masks_path=masks_path,
                invert=invert,
                prompt=prompt,
                merged_mask_path=merged_mask_path,
            )

            # Combined with overlay
            self.inpainter.compose_image(
                inpainted_img = img,
                output_path = output_img_path,
                watermark_overlay_paths = watermark_overlay_masks,
                upload_overlay_paths = upload_overlay_masks,
            )

