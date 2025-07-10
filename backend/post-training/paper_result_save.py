import os
import subprocess

Retraining_Path = '/home/pureblackkkk/data/Bias-Detector/backend/post-training/retraining_result'
Save_Folder = '/home/pureblackkkk/data/Bias-Detector/backend/post-training/paper_result'


if __name__ == '__main__':
    script_name = "retraining.py"
    dataset_uid_dict = {
        'waterbirds': [
            # '_zuIRXgZaTWzRa6ejHqFl',
            # '0hjSCFBH9KhkhAz62Xlc1',
            # '07TmXKWrbXLAx4FLXhsJg',
            # 'E5PbXa8VxFoF29aWQWh5N',
            # 'iXTpRfqFQSzvrS_mx-Ffj',
            'original_watermark_test',
            'system_watermark_test',
        ],
        'urbancars': [
            # '43YWfXc-z4fLQcNzF_TNm',
            # 'HKvHwvLcJOfDFARDq_PvU',
            # 'hOF_QLUowKmCDk-2F4Igf',
            # 'MRayUs_JdDwUVyODwt0Qt',
            # 'OO71OCc42alpo1kUJ2E6',
        ],
    }

    for dataset, uid_list in dataset_uid_dict.items():
        for uid in uid_list:
            # Open ratio num
            ratio_path = os.path.join(Retraining_Path, uid, dataset, 'best_ratio.txt')

            with open(ratio_path, "r") as f:
                ratio = f.readline().strip()

            save_folder_path = os.path.join(Save_Folder, uid)
            os.makedirs(save_folder_path, exist_ok=True)

            # Biased part
            biased_save_name = os.path.join(save_folder_path, 'biased.json')
            subprocess.run([
                'python',
                script_name,
                '--device', 'cuda:2',
                '--user_id', uid,
                '--dataset', dataset,
                '--partial_ratio', ratio,
                '--skip_training',
                '--compare_biased',
                '--save_result_path', str(biased_save_name),
            ])

            # None biased part
            non_biased_save_name = os.path.join(save_folder_path, 'non-biased.json')
            subprocess.run([
                'python',
                script_name,
                '--device', 'cuda:2',
                '--user_id', uid,
                '--dataset', dataset,
                '--partial_ratio', ratio,
                '--skip_training',
                '--compare_biased',
                '--compare_none_biased',
                '--save_result_path', str(non_biased_save_name)
            ])

            # Overall
            overall_save_name = os.path.join(save_folder_path, 'overall.json')
            subprocess.run([
                'python',
                script_name,
                '--device', 'cuda:2',
                '--user_id', uid,
                '--dataset', dataset,
                '--partial_ratio', ratio,
                '--skip_training',
                '--save_result_path', str(overall_save_name)
            ])
