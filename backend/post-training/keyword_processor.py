from typing import List
from utils import solve_path_for_static_file

class KeywordProcessor:
    def __init__(self, built_in_keywords_dict):
        self.built_in_keywords_dict = built_in_keywords_dict

    def group_keywords(
        self,
        dataset,
        class_name,
        recieved_keywords_list,
        recieved_mask_path_list,
    ):
        # built in keywords list
        built_in_keywords = self.built_in_keywords_dict[dataset][class_name]
        print(built_in_keywords)

        # Take the first one mask path as reference
        ref_mask_path_list = recieved_mask_path_list[0]['pathList']

        # Remove the built_in keyword from recieved_keywords_list
        filtered_keyowrds = list(filter(lambda x: not x in built_in_keywords, recieved_keywords_list))
        built_in_keywords = list(filter(lambda x: x in built_in_keywords, recieved_keywords_list))

        # Remove the built_in mask from the recieved_mask_list
        filtered_masks = list(filter(lambda x: not 'static/phanoptic' in x, ref_mask_path_list))

        # Get draw keywords, draw mask path
        draw_keyword_mask_pairs = [(filtered_keyowrds[idx], path) for idx, path in enumerate(filtered_masks) if 'draw.png' in path ]

        # get upload image overlay
        print(built_in_keywords, filtered_keyowrds, filtered_masks)
        upload_overlay_pairs = [(filtered_keyowrds[idx], path) for idx, path in enumerate(filtered_masks) if 'static/upload' in path ]
        upload_overlay_masks = [solve_path_for_static_file(item[1]) for item in upload_overlay_pairs]

        # watermark overlay mask
        watermark_overlay_pairs = [(filtered_keyowrds[idx], path) for idx, path in enumerate(filtered_masks) if 'static/watermark' in path ]
        watermark_overlay_masks = [solve_path_for_static_file(item[1]) for item in watermark_overlay_pairs]

        # Get manual keywords
        manual_generate_keywords = list(
            set(filtered_keyowrds) - set([keyword for keyword, _ in draw_keyword_mask_pairs])
            - set([keyword for keyword, _ in upload_overlay_pairs])
            - set([keyword for keyword, _ in watermark_overlay_pairs])
        )

        return upload_overlay_masks, watermark_overlay_masks, draw_keyword_mask_pairs, manual_generate_keywords, built_in_keywords