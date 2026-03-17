from datetime import datetime
from config import db

class Forecast:

    # -----------------------------
    # UPSERT FORECAST (No Duplicates)
    # -----------------------------
    @staticmethod
    def create_forecast(dataset_id, product, confidence, forecast_data):
        dataset_id = str(dataset_id).strip()
        product = str(product).strip()

        forecast_doc = {
            "$set": {
                "dataset_id": dataset_id,
                "product": product,
                "confidence": confidence,
                "forecast_data": forecast_data,
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        }

        # Update if exists, insert if it doesn't
        db.forecasts.update_one(
            {"dataset_id": dataset_id, "product": product},
            forecast_doc,
            upsert=True
        )

        # Return the data so the route can use it
        return {
            "dataset_id": dataset_id,
            "product": product,
            "confidence": confidence,
            "forecast_data": forecast_data
        }

    @staticmethod
    def get_forecasts_by_dataset(dataset_id):
        return list(db.forecasts.find({"dataset_id": str(dataset_id).strip()}, {"_id": 0}))

    @staticmethod
    def get_product_forecast(dataset_id, product):
        return db.forecasts.find_one({
            "dataset_id": str(dataset_id).strip(),
            "product": str(product).strip()
        }, {"_id": 0})