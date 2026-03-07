from datetime import datetime
from config import db


class Dataset:

    @staticmethod
    def create_dataset(user_id, dataset_id, original_filename, clean_file,
                       rows, products, date_range):

        dataset = {
            "user_id": user_id,
            "dataset_id": dataset_id,
            "original_filename": original_filename,
            "clean_file": clean_file,
            "rows": rows,
            "products": products,
            "date_range": date_range,
            "created_at": datetime.utcnow()
        }

        db.datasets.insert_one(dataset)

        return dataset


    @staticmethod
    def get_all_datasets():
        datasets = list(db.datasets.find({}, {"_id": 0}))
        return datasets


    @staticmethod
    def get_user_datasets(user_id):
        datasets = list(db.datasets.find(
            {"user_id": user_id},
            {"_id": 0}
        ))
        return datasets


    @staticmethod
    def get_dataset_by_id(dataset_id):
        dataset = db.datasets.find_one(
            {"dataset_id": dataset_id},
            {"_id": 0}
        )
        return dataset