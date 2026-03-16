from datetime import datetime
from config import db


class Forecast:

    # -----------------------------
    # SAVE FORECAST
    # -----------------------------
    @staticmethod
    def create_forecast(dataset_id, product, confidence, forecast_data):

        dataset_id = str(dataset_id).strip()
        product = str(product).strip()

        # Delete old forecast for SAME dataset + SAME product
        db.forecasts.delete_many({
            "dataset_id": dataset_id,
            "product": product
        })

        forecast_doc = {
            "dataset_id": dataset_id,
            "product": product,
            "confidence": confidence,
            "forecast_data": forecast_data,
            "created_at": datetime.utcnow()
        }

        db.forecasts.insert_one(forecast_doc)

        return forecast_doc


    # -----------------------------
    # GET FORECAST BY DATASET
    # -----------------------------
    @staticmethod
    def get_forecasts_by_dataset(dataset_id):

        forecasts = list(
            db.forecasts.find(
                {"dataset_id": str(dataset_id).strip()},
                {"_id": 0}
            )
        )

        return forecasts


    # -----------------------------
    # GET SINGLE PRODUCT FORECAST
    # -----------------------------
    @staticmethod
    def get_product_forecast(dataset_id, product):

        forecast = db.forecasts.find_one(
            {
                "dataset_id": str(dataset_id).strip(),
                "product": str(product).strip()
            },
            {"_id": 0}
        )

        return forecast