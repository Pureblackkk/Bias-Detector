import torch
import torchvision
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import os
from sklearn.metrics import f1_score, accuracy_score, precision_score, recall_score, roc_auc_score
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data_loader")))
from train_data_loader import load_dataloader
from PIL import Image
from torch.utils.data import random_split
import pandas as pd
from glob import glob
import json
import argparse
import random
import numpy as np
from tqdm import tqdm
from pathlib import Path

seed = 42
random.seed(seed)
# NumPy
np.random.seed(seed)
# PyTorch
torch.manual_seed(seed)
torch.cuda.manual_seed(seed)
torch.cuda.manual_seed_all(seed)  # if you are using multi-GPU.
# CuDNN determinism
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False


def parse_args():
    # Set up an argument parser
    parser = argparse.ArgumentParser(description='Load dataset')
    parser.add_argument('--dataset', default="urbancars", type=str, help='Name of the dataset')
    parser.add_argument('--user_id', type=str)
    parser.add_argument('--device', default="cuda:1", type=str, help='Device to use')
    parser.add_argument('--epoch', default=50, type=int, help='epoch for training')
    parser.add_argument('--optimizer', default='adam', type=str, help='optimizer type')
    parser.add_argument('--learning_rate', default=0.01, type=float, help='optimizer type')
    parser.add_argument('--fine_tune', action='store_true')
    parser.add_argument('--skip_training', action='store_true')
    parser.add_argument('--compare_subclass', type=str)
    parser.add_argument('--compare_biased', action='store_true')
    parser.add_argument('--compare_none_biased', action='store_true')
    parser.add_argument('--partial_ratio', default=1, type=float)
    parser.add_argument('--iterative_partial', action='store_true')
    parser.add_argument('--validation_ratio', default=None, type=float)
    parser.add_argument('--save_result_path', default=None, type=str)

    # Parse the command-line arguments
    args = parser.parse_args()

    return args

def get_dataset_by_data_loader(
    datasetname: str,
    user_id: str,
):  
    # Get original dataset dir
    origin_data_dir = None
    match datasetname:
        case 'waterbirds':
            origin_data_dir = '/home/pureblackkkk/data/Bias-Detector/Waterbirds'
        case 'urbancars':
            origin_data_dir = '/home/pureblackkkk/data/Bias-Detector/UrbanCars'
    
    # Get augmentation img path list
    augment_root_folder_path = '/home/pureblackkkk/data/Bias-Detector/backend/post-training/augmentations' 
    user_folder = os.path.join(augment_root_folder_path, user_id)
    user_folder_dataset_list = os.listdir(user_folder)
    dataset_folders_for_train = filter(lambda x: datasetname in x, user_folder_dataset_list)

    class_inpainting_path_pair = []

    for dataset_folder in dataset_folders_for_train:
        class_name = dataset_folder.split('-')[1]
        # Get all the inpainting image
        imgs = list(map(
            lambda x: str(x), (Path(os.path.join(user_folder, dataset_folder)).glob("*/*/inpainting.jpg"))
        ))

        # Select partial imgs based on args
        imgs = random.sample(imgs, int(len(imgs) * args.partial_ratio))

        class_inpainting_path_pair.append((class_name, imgs))


    # Get data loader
    return load_dataloader(
        dataset_name=datasetname,
        data_dir=origin_data_dir,
        augment_pairs= None if args.skip_training else class_inpainting_path_pair,
        bs_train=128,
        bs_val=128,
        fine_tune=args.fine_tune,
        sub_class=args.compare_subclass,
        biased=args.compare_biased,
        none_biased=args.compare_none_biased,
        validation_ratio=args.validation_ratio,
    )

def create_folder_for_user(uid, dataset):
    folder_path = os.path.join(
        '/home/pureblackkkk/data/Bias-Detector/backend/post-training/retraining_result',
        uid,
        dataset,
    )
    os.makedirs(folder_path, exist_ok=True)

    # Create log file
    if not args.skip_training:
        log_file = os.path.join(folder_path, f"output-finetune_{args.fine_tune}-lr_{args.learning_rate}-optimizer_{args.optimizer}-partial_{args.partial_ratio}-valratio_{args.validation_ratio}.log")
        sys.stdout = open(log_file, "w")
        sys.stderr = sys.stdout

    return folder_path

def get_base_model(dataset: str):
    match dataset:
        case 'waterbirds':
            base_model_path = './basemodel/waterbirds-lr_0.01-optimizer_adam.pth'
        case 'urbancars':
            base_model_path = './basemodel/urbancars-lr_0.01-optimizer_adam.pth'

    base_model = torch.load(base_model_path, map_location="cpu")
    if isinstance(base_model, torch.nn.DataParallel):
        base_model = base_model.module  

    return base_model

def compare_with_base_model(
    dataset: str,
    result_model_name: str,
    train_loader,
    valid_loader,
    test_loader,
    device,
    save_folder,
    arg_save_path,
):
    # Load the base model
    base_model_path = None
    match dataset:
        case 'waterbirds':
            base_model_path = './basemodel/waterbirds-lr_0.01-optimizer_adam.pth'
        case 'urbancars':
            base_model_path = './basemodel/urbancars-lr_0.01-optimizer_adam.pth'

    base_model = torch.load(base_model_path, map_location="cpu")
    if isinstance(base_model, torch.nn.DataParallel):
        base_model = base_model.module  
    base_model = base_model.to(device)

    # Load current model
    current_model = torch.load(os.path.join(save_folder, result_model_name), map_location="cpu")
    current_model.to(device)

    loader_list = [
        ('train', train_loader),
        ('valid', valid_loader),
        ('test', test_loader),
    ]

    # Compare result
    compare_res = {}
    with torch.no_grad():
        for data_type, data_loader in loader_list:
                y_true = []

                y_pred_base = []
                y_prob_base = []

                y_pred_current = []
                y_prob_current = []

                for data in data_loader:
                    inputs, labels, _, _ = data
                    inputs, labels = inputs.to(device), labels.to(device)

                    outputs_base = base_model(inputs)
                    outputs_current = current_model(inputs)

                    _, predicted_base = torch.max(outputs_base, 1)
                    _, predicted_current = torch.max(outputs_current, 1)

                    probs_base = F.softmax(outputs_base, dim=1)[:, 1]
                    probs_current = F.softmax(outputs_current, dim=1)[:, 1]

                    y_pred_base.extend(predicted_base.cpu().numpy())
                    y_pred_current.extend(predicted_current.cpu().numpy())

                    y_true.extend(labels.cpu().numpy())

                    y_prob_base.extend(probs_base.cpu().numpy())
                    y_prob_current.extend(probs_current.cpu().numpy())
                
                y_true = np.array(y_true)
                y_pred_base = np.array(y_pred_base)
                y_prob_base = np.array(y_prob_base)

                y_pred_current = np.array(y_pred_current)
                y_prob_current = np.array(y_prob_current)

                compare_res[data_type] = {}
                compare_res[data_type]['base'] = {
                    "Accuracy": accuracy_score(y_true, y_pred_base),
                    "Precision": precision_score(y_true, y_pred_base),
                    "Recall": recall_score(y_true, y_pred_base),
                    "F1-score": f1_score(y_true, y_pred_base, average='macro'),
                    # "AUC-ROC": roc_auc_score(y_true, y_prob_base)
                }

                compare_res[data_type]['current'] = {
                    "Accuracy": accuracy_score(y_true, y_pred_current),
                    "Precision": precision_score(y_true, y_pred_current),
                    "Recall": recall_score(y_true, y_pred_current),
                    "F1-score": f1_score(y_true, y_pred_current, average='macro'),
                    # "AUC-ROC": roc_auc_score(y_true, y_prob_current)
                }
                
    # Save result to log
    if arg_save_path:
        with open(arg_save_path, "w") as f:
            json.dump(compare_res, f, indent=4)
    else:
        with open(os.path.join(save_folder, f"result_compare_{result_model_name}.json"), "w") as f:
            json.dump(compare_res, f, indent=4)

args = parse_args()

if __name__ == '__main__':
    def startTraining():
        # Create folder for saving the model and logs for each user
        save_folder = create_folder_for_user(
            uid=args.user_id,
            dataset=args.dataset,
        )

        # Create dataloader
        trainloader, valloader, testloader = get_dataset_by_data_loader(
            datasetname=args.dataset,
            user_id=args.user_id,
        )

        # Load the ResNet-50 model from base model or a new one
        if args.fine_tune:
            model = get_base_model(args.dataset)
        else:
            model = torchvision.models.resnet50(pretrained=False)
            num_classes = 2  # Update this to your number of classes
            model.fc = nn.Linear(model.fc.in_features, num_classes)

        # Define the loss function and optimizer
        criterion = nn.CrossEntropyLoss()

        match args.optimizer:
            case 'sgd':
                optimizer = optim.SGD(model.parameters(), lr=args.learning_rate)
            case 'adam':
                optimizer = optim.Adam(model.parameters(), lr=args.learning_rate)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

        device = torch.device(args.device)
        model = model.to(device)

        best_f1 = 0.0

        model_name = f'finetune_{args.fine_tune}-{args.dataset}-lr_{args.learning_rate}-optimizer_{args.optimizer}-partial_{args.partial_ratio}-valratio_{args.validation_ratio}.pth'

        if not args.skip_training:
            # Train the model
            for epoch in tqdm(range(args.epoch)):  # Update number of epochs here
                model.train()
                running_loss = 0.0
                correct = 0
                total = 0
                for data in trainloader:
                    inputs, labels, _, _ = data
                    inputs, labels = inputs.to(device), labels.to(device)

                    optimizer.zero_grad()

                    outputs = model(inputs)
                    _, predicted = torch.max(outputs.data, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()

                    running_loss += loss.item()

                # Validation phase
                model.eval()
                y_pred = []
                y_true = []

                with torch.no_grad():
                    for data in valloader:
                        inputs, labels, _, _ = data
                        inputs, labels = inputs.to(device), labels.to(device)
                        outputs = model(inputs)
                        _, predicted = torch.max(outputs, 1)
                        y_pred.extend(predicted.cpu().numpy())
                        y_true.extend(labels.cpu().numpy())

                # Calculate F1 Score
                y_true = np.array(y_true)
                y_pred = np.array(y_pred)
                val_f1_macro = f1_score(y_true, y_pred, average='macro')
                
                y_pred = []
                y_true = []

                with torch.no_grad():
                    for data in testloader:
                        inputs, labels, _, _ = data
                        inputs, labels = inputs.to(device), labels.to(device)
                        outputs = model(inputs)
                        _, predicted = torch.max(outputs, 1)
                        y_pred.extend(predicted.cpu().numpy())
                        y_true.extend(labels.cpu().numpy())

                # Calculation of the F1 Score
                y_true = np.array(y_true)
                y_pred = np.array(y_pred)
                test_f1_macro = f1_score(y_true, y_pred, average='macro')

                print(f'Epoch {epoch+1}, Training Loss: {running_loss / len(trainloader):.4f}, Validation F1-Score: {val_f1_macro:.4f}, Test F1-Score: {test_f1_macro:.4f}')

                # Save model if validation accuracy has increased
                if val_f1_macro > best_f1:
                    print(f'Validation F1 score increased ({best_f1:.4f} --> {val_f1_macro:.4f}), meanwhile Test F1-Score: {test_f1_macro:.4f}.  Saving model ...')
                    best_f1 = val_f1_macro
                    torch.save(model, os.path.join(save_folder, model_name))

        # Compare with the base model
        compare_with_base_model(
            dataset=args.dataset,
            result_model_name=model_name,
            train_loader=trainloader,
            valid_loader=valloader,
            test_loader=testloader,
            device=device,
            save_folder=save_folder,
            arg_save_path=args.save_result_path,
        )

        return best_f1

    if args.iterative_partial:
        partial_ratio_range = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        bestF1 = 0.0
        folder_path_best = os.path.join(
            '/home/pureblackkkk/data/Bias-Detector/backend/post-training/retraining_result',
            args.user_id,
            args.dataset,
            'best_ratio.txt',
        )

        for partial_ratio in partial_ratio_range:
            args.partial_ratio = partial_ratio
            currentBestF1 = startTraining()

            if currentBestF1 > bestF1:
                bestF1 = currentBestF1
                # Save the notation for which partial is the best
                with open(folder_path_best, "w") as f:
                    f.write(str(partial_ratio))
    else:
        startTraining()