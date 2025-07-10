import os
import json
import argparse
from database_connector import DatabaseConnector
from workflow_manager import UserWorkFLow
from keyword_processor import KeywordProcessor
from utils import get_built_in_dict, sample_solution_imgs
from segmentor import Segmentor, UserImageSegmentor
from inpainter import Inpainer

DEFAULT_DATABASE_PATH = '/home/pureblackkkk/data/Bias-Detector/backend/data.db'
DEFAULT_TABLE_NAME = 'user_data'
BUILT_IN_KEYWORDS_LIST_URBANCARS = '/home/pureblackkkk/data/Bias-Detector/backend/urbancars/panoptic_categories.json'
BUILT_IN_KEYWORDS_LIST_WATERBIRDS = '/home/pureblackkkk/data/Bias-Detector/backend/waterbirds/panoptic_categories.json'
BUILT_IN_PANOPTIC_URBANCARS = '/home/pureblackkkk/data/Bias-Detector/backend/urbancars/panoptic.json'
BUILT_IN_PANOPTIC_WATERBIRDS = '/home/pureblackkkk/data/Bias-Detector/backend/waterbirds/panoptic.json'
BUILT_IN_TRAIN_IMG_FOLDER = '/home/pureblackkkk/data/Bias-Detector/backend/static/train'
BUILT_IN_PANOPTIC_FOLDER = '/home/pureblackkkk/data/Bias-Detector/backend/static/phanoptic/train'

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--database_path", type = str, default=DEFAULT_DATABASE_PATH)
    parser.add_argument("--table_name", type = str, default=DEFAULT_TABLE_NAME)
    parser.add_argument("--uid", type=str, default=None)
    parser.add_argument("--solution_id", type=int, default=None)
    parser.add_argument("--solution_id_list", nargs="+", type=int, default=None)
    parser.add_argument("--device", type=str, default=None)
    parser.add_argument("--dataset", type=str, default=None)
    args = parser.parse_args()
    return args


if __name__ == '__main__':
    args = parse_args()

    # Create database connector
    database_connector = DatabaseConnector(
        args.database_path,
        args.table_name,
    )

    # Create Segmentor
    segmentor = Segmentor()

    # Create keyword processor
    keywordProcessor = KeywordProcessor(
        get_built_in_dict(
            urbancars_json=BUILT_IN_KEYWORDS_LIST_URBANCARS,
            waterbirds_json=BUILT_IN_KEYWORDS_LIST_WATERBIRDS,
        )
    )

    # Create Impainter
    inpainter = Inpainer()

    # Create panoptic dict
    built_in_panoptic_dict = get_built_in_dict(
        urbancars_json=BUILT_IN_PANOPTIC_URBANCARS,
        waterbirds_json=BUILT_IN_PANOPTIC_WATERBIRDS,
    )

    if args.uid:
        if args.dataset:
            user_data = database_connector.get_user_data_by_user_id_and_dataset(
                uid=args.uid,
                dataset=args.dataset
            )
        else:
            user_data = database_connector.get_user_data_by_uid(args.uid)
    elif args.solution_id:
        user_data = database_connector.get_user_data_by_solution_id(args.solution_id)
    elif args.solution_id_list:
        user_data = database_connector.get_user_data_by_solution_id_list(args.solution_id_list)
    else:
        user_data = database_connector.get_all_user_data()

    print(user_data)
    # Create inpainting for each user with solutions
    for user_id, solution_list in user_data.items():
        print(f'Processing user {user_id}...........')

        # Create user segmentor
        userSegmentor = UserImageSegmentor(
            uid=user_id,
            segmentor=segmentor,
        )

        # Create workflow for this user
        userWorkFLow = UserWorkFLow(
            uid=user_id,
            keyword_processor=keywordProcessor,
            segmentor=userSegmentor,
            inpainter=inpainter,
        )

        # Inpaining for each solution
        for solution in solution_list:
            # TODO: change the server for adding a fields
            query = solution['solution_query']
            solution_strategy = solution['solution_strategy'] if solution['solution_strategy'] else 'default'
            print(f'Inpatinig for solution \"{query}\":')
            dataset = solution['dataset']
            label = solution['class_name']
            prompt = solution['solution_query'].replace('A picture', 'An image')
            
            # Sample solution images from origin dataset
            solution_imgs=sample_solution_imgs(
                numbers=solution['solution'],
                img_folder_path=str(os.path.join(BUILT_IN_TRAIN_IMG_FOLDER, label)),
                panoptic_folder_path=str(os.path.join(BUILT_IN_PANOPTIC_FOLDER, label)),
                dataset=dataset,
            )

            # Get panoptic dict
            solution_panoptic=built_in_panoptic_dict[dataset][label]

            userWorkFLow.inpainting_for_solution(
                dataset=dataset,
                label=label,
                solution_name=solution_strategy,
                solution_imgs=solution_imgs,
                panoptic_dict=solution_panoptic,
                invert=solution['invert'],
                prompt=prompt,
                keyword_list=json.loads(solution['keywords']),
                mask_path_list=json.loads(solution['batch_mask']),
            )





