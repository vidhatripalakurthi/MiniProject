from datetime import datetime
from config import db
import uuid

class Dataset:

    # -----------------------------
    # UPSERT DATASET RECORD
    # -----------------------------
    @staticmethod
    def upsert_dataset(
        user_id,
        original_filename,
        clean_file,
        rows,
        products,
        date_range
    ):
        # Check if this user already uploaded a file with this exact name
        existing = db.datasets.find_one({
            "user_id": user_id,
            "original_filename": original_filename
        })

        # Reuse existing ID or create a new one
        dataset_id = existing["dataset_id"] if existing else str(uuid.uuid4())

        dataset_doc = {
            "$set": {
                "user_id": user_id,
                "dataset_id": dataset_id,
                "original_filename": original_filename,
                "clean_file": clean_file,
                "rows": rows,
                "products": products,
                "date_range": date_range,
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        }

        # Update if exists, insert if it doesn't
        db.datasets.update_one(
            {"user_id": user_id, "original_filename": original_filename},
            dataset_doc,
            upsert=True
        )

        return dataset_id

    # ... keep your existing get_all_datasets, get_user_datasets, get_dataset_by_id functions below ...
    @staticmethod
    def get_all_datasets():
        return list(db.datasets.find({}, {"_id": 0}))

    @staticmethod
    def get_user_datasets(user_id):
        return list(db.datasets.find({"user_id": user_id}, {"_id": 0}))

    @staticmethod
    def get_dataset_by_id(dataset_id):
        return db.datasets.find_one({"dataset_id": dataset_id}, {"_id": 0})