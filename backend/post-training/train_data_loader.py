import numpy as np
import os
import torch
import random
import torchvision.transforms as transforms
from torch.utils.data import Dataset, DataLoader
from PIL import Image

class Waterbird(Dataset):
    def __init__(
        self,
        data_dir: str,
        augment_pairs: list,
        fine_tune: bool,
        sub_class: str,
        biased: bool,
        none_biased: bool,
        validation_ratio: float = None,
        type_name: str = 'train',
    ):
        class_name = ['waterbird', 'landbird']

        if sub_class:
            class_name = [sub_class]
        
        # File name
        if not biased:
            self.img_name = [
                img
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
            ]
        else:
            self.img_name = [
                img
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss))
                if self.__is_biased_img(img, clsss, none_biased)
            ]

        print('original size: ', len(self.img_name))

        # Add augment image name
        if augment_pairs and type_name == 'train':
            augment_img_name = [
                img_path.split('/')[-2]
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]

            print('augmentation size: ', len(augment_img_name))

            if fine_tune:
                self.img_name = augment_img_name
            else:
                self.img_name.extend(augment_img_name)

        
        # Validation group shifting
        if augment_pairs and type_name == 'val' and validation_ratio:
            augment_img_name = [
                img_path.split('/')[-2]
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]
            augment_img_name = random.sample(augment_img_name, int(len(augment_img_name) * validation_ratio))
            
            print('validatoin compensation: ', len(augment_img_name))
            self.img_name.extend(augment_img_name)
        
        # File path
        if not biased:
            self.img_path_array = [
                os.path.join(data_dir, type_name, clsss, img)
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
            ]
        else:
            self.img_path_array = [
                os.path.join(data_dir, type_name, clsss, img)
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss))
                if self.__is_biased_img(img, clsss, none_biased)
            ]

        if augment_pairs and type_name == 'train':
            augment_img_path_array = [
                img_path
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]

            if fine_tune:
                self.img_path_array = augment_img_path_array
            else:
                self.img_path_array.extend(augment_img_path_array)
        
        # Validation group shifting
        if augment_pairs and type_name == 'val' and validation_ratio:
            augment_img_path_array = [
                img_path
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]

            augment_img_path_array = random.sample(augment_img_path_array, int(len(augment_img_path_array) * validation_ratio))
            self.img_path_array.extend(augment_img_path_array)

        # y value
        if not biased:
            self.target = torch.tensor([
                1 if clsss == 'waterbird' else 0
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
            ])
        else:
            self.target = torch.tensor([
                1 if clsss == 'waterbird' else 0
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss))
                if self.__is_biased_img(img, clsss, none_biased)
            ])

        if augment_pairs and type_name == 'train':
            augment_target = torch.tensor([
                1 if clsss == 'waterbird' else 0
                for clsss, paths in augment_pairs
                for _ in paths
            ])

            if fine_tune:
                self.target = augment_target
            else:
                self.target = torch.cat((self.target, augment_target), dim=0)
        
        # Validation group shifting
        if augment_pairs and type_name == 'val' and validation_ratio:
            augment_target = [
                1 if clsss == 'waterbird' else 0
                for clsss, paths in augment_pairs
                for _ in paths
            ]

            augment_target = torch.tensor(random.sample(augment_target, int(len(augment_target) * validation_ratio)))
            self.target = torch.cat((self.target, augment_target), dim=0)

        # background value
        self.background = list(map(lambda x: 0 if x.split('_')[0] == 'land' else 1, self.img_name))

        # Is marked
        self.is_marked = list(map(lambda x: 0 if x.split('_')[1] == 'X' else 1, self.img_name))

        # Define transform
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ])

        print(type_name, len(self.img_name))
    
    def __len__(self):
        return len(self.img_name)
    
    def __getitem__(self, idx):
        img = Image.open(self.img_path_array[idx]).convert('RGB')

        x = self.transform(img)
        y = self.target[idx]
        background = self.background[idx]
        is_marked = self.is_marked[idx]
        path = self.img_path_array[idx]

        return x, y, (background, is_marked), path

    def __is_biased_img(self, name_or_path: str, clsss, select_non_biased: bool):
        if clsss == 'landbird':
            is_biased =  (
                'land_O' in name_or_path
                or 'water_X' in name_or_path
                or 'water_O' in name_or_path
            )

            return (not is_biased) if select_non_biased else is_biased
            
        else:
            is_biased = (
                'land_O' in name_or_path
                or 'land_X' in name_or_path
                or 'water_X' in name_or_path
            )
        
            return (not is_biased) if select_non_biased else is_biased


class Urbancars(Dataset):
    def __init__(
        self,
        data_dir: str,
        augment_pairs: list,
        fine_tune: bool,
        sub_class: str,
        biased: bool,
        none_biased: bool,
        validation_ratio: float = None,
        type_name: str = 'train',
    ):
        class_name = ['country', 'urban']
        
        if sub_class:
            class_name = [sub_class]
        
        # File name
        if not biased:
            self.img_name = [
                img
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
            ]
        else:
            self.img_name = [
                img
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss))
                if self.__is_biased_img(img, clsss, none_biased)
            ]
        
        print('original size: ', len(self.img_name))

        # Add augment image name only for train dataset
        if augment_pairs and type_name == 'train':
            augment_img_name = [
                img_path.split('/')[-2]
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]

            print('augmentation size: ', len(augment_img_name))

            if fine_tune:
                self.img_name = augment_img_name
            else:
                self.img_name.extend(augment_img_name)

        # Validation group shifting
        if augment_pairs and type_name == 'val' and validation_ratio:
            augment_img_name = [
                img_path.split('/')[-2]
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]
            augment_img_name = random.sample(augment_img_name, int(len(augment_img_name) * validation_ratio))
            
            print('validatoin compensation: ', len(augment_img_name))
            self.img_name.extend(augment_img_name)

        # File path
        if not biased:
            self.img_path_array = [
                os.path.join(data_dir, type_name, clsss, img)
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
            ]
        else:
            self.img_path_array = [
                os.path.join(data_dir, type_name, clsss, img)
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
                if self.__is_biased_img(img, clsss, none_biased)
            ]

        if augment_pairs and type_name == 'train':
            augment_img_path_array = [
                img_path
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]

            if fine_tune:
                self.img_path_array = augment_img_path_array
            else:
                self.img_path_array.extend(augment_img_path_array)
        

        # Validation group shifting
        if augment_pairs and type_name == 'val' and validation_ratio:
            augment_img_path_array = [
                img_path
                for augment_pair in augment_pairs
                for img_path in augment_pair[1]
            ]

            augment_img_path_array = random.sample(augment_img_path_array, int(len(augment_img_path_array) * validation_ratio))
            self.img_path_array.extend(augment_img_path_array)

        # Y value
        if not biased:
            self.target = torch.tensor([
                1 if clsss == 'urban' else 0
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss)) 
            ])
        else:
            self.target = torch.tensor([
                1 if clsss == 'urban' else 0
                for clsss in class_name
                for img in os.listdir(os.path.join(data_dir, type_name, clsss))
                if self.__is_biased_img(img, clsss, none_biased)
            ])

        if augment_pairs and type_name == 'train':
            augment_target = torch.tensor([
                1 if clsss == 'urban' else 0
                for clsss, paths in augment_pairs
                for _ in paths
            ])

            if fine_tune:
                self.target = augment_target
            else:
                self.target = torch.cat((self.target, augment_target), dim=0)

        # Validation group shifting
        if augment_pairs and type_name == 'val' and validation_ratio:
            augment_target = [
                1 if clsss == 'urban' else 0
                for clsss, paths in augment_pairs
                for _ in paths
            ]

            augment_target = torch.tensor(random.sample(augment_target, int(len(augment_target) * validation_ratio)))
            self.target = torch.cat((self.target, augment_target), dim=0)

        # Define transform
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ])

        print(type_name, len(self.img_name))
    
    def __len__(self):
        return len(self.img_name)
    
    def __getitem__(self, idx):
        img = Image.open(self.img_path_array[idx]).convert('RGB')
        
        x = self.transform(img)
        y = self.target[idx]
        path = self.img_path_array[idx]

        return x, y, 0, path


    def __is_biased_img(self, name_or_path: str, clsss, select_non_biased: bool):
        if clsss == 'country':
            is_biased = (
                'bg-urban' in name_or_path
                or 'co_occur_obj-urban' in name_or_path
            )
            return (not is_biased) if select_non_biased else is_biased
        
        else:
            is_biased = (
                'bg-country' in name_or_path
                or 'co_occur_obj-country' in name_or_path
            )
            return (not is_biased) if select_non_biased else is_biased

def load_dataloader(
    dataset_name: str,
    data_dir: str,
    augment_pairs: list,
    fine_tune: bool,
    sub_class: str,
    biased: bool,
    none_biased: bool,
    validation_ratio: float,
    bs_train=128,
    bs_val=128,
    num_workers=8
):
    match dataset_name:
        case 'waterbirds':
            train_set = Waterbird(
                data_dir=data_dir,
                augment_pairs=augment_pairs,
                type_name='train',
                fine_tune=fine_tune,
                sub_class=sub_class,
                biased=biased,
                none_biased=none_biased,
            )
            val_set = Waterbird(
                data_dir=data_dir,
                augment_pairs=augment_pairs,
                type_name='val',
                fine_tune=fine_tune,
                sub_class=sub_class,
                biased=biased,
                none_biased=none_biased,
                validation_ratio=validation_ratio,
            )
            test_set = Waterbird(
                data_dir=data_dir,
                augment_pairs=augment_pairs,
                type_name='test',
                fine_tune=fine_tune,
                sub_class=sub_class,
                biased=biased,
                none_biased=none_biased,
            )
        case 'urbancars':
            train_set = Urbancars(
                data_dir=data_dir,
                augment_pairs=augment_pairs,
                type_name='train',
                fine_tune=fine_tune,
                sub_class=sub_class,
                biased=biased,
                none_biased=none_biased,
            )
            val_set = Urbancars(
                data_dir=data_dir,
                augment_pairs=augment_pairs,
                type_name='val',
                fine_tune=fine_tune,
                sub_class=sub_class,
                biased=biased,
                none_biased=none_biased,
                validation_ratio=validation_ratio,
            )
            test_set = Urbancars(
                data_dir=data_dir,
                augment_pairs=augment_pairs,
                type_name='test',
                fine_tune=fine_tune,
                sub_class=sub_class,
                biased=biased,
                none_biased=none_biased,
            )
        case _:
            raise ValueError("Unsupported dataset ")
    
    train_loader = DataLoader(train_set, batch_size=bs_train, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_set, batch_size=bs_val, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_set, batch_size=bs_val, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, test_loader