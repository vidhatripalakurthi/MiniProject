import os
import pandas as pd
from flask import Blueprint, request, jsonify, Response
from config import db
from ml.forecast_pipeline import run_forecast_pipeline
from models.dataset_model import Dataset
from models.forecast_model import Forecast

forecast_bp = Blueprint("forecast", __name__)

@forecast_bp.route("/generate-forecast", methods=["POST"])
def generate_forecast():
    try:
        data = request.json
        dataset_id = data.get("dataset_id")
        
        # 'product' could now be a string ("Milk") or a list (["Milk", "Bread"])
        product_payload = data.get("product") 

        if not dataset_id:
            return jsonify({"success": False, "message": "dataset_id is required"}), 400

        dataset = Dataset.get_dataset_by_id(dataset_id)
        if not dataset:
            return jsonify({"success": False, "message": "Dataset not found"}), 404

        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        clean_path = os.path.join(BASE_DIR, "cleandata", dataset["clean_file"])

        # Run pipeline (handles both string and list natively)
        results = run_forecast_pipeline(
            file_path=clean_path,
            selected_product=product_payload
        )

        response_data = {}

        for product_name, result in results.items():
            forecast_values = result["forecast"]

            df = pd.read_csv(clean_path)
            df["Date"] = pd.to_datetime(df["Date"])
            last_date = df["Date"].max()

            future_dates = pd.date_range(
                start=last_date + pd.Timedelta(weeks=1),
                periods=len(forecast_values),
                freq="W"
            )

            week_ranges = []
            for date in future_dates:
                start_date = date.strftime("%d-%m-%Y")
                end_date = (date + pd.Timedelta(days=6)).strftime("%d-%m-%Y")
                week_ranges.append(f"{start_date} to {end_date}")

            forecast_df = pd.DataFrame({
                "Week": week_ranges,
                "Product": product_name,
                "Forecast_Demand": forecast_values
            })

            forecast_records = forecast_df.to_dict(orient="records")

            # This now uses the safe UPSERT method
            Forecast.create_forecast(
                dataset_id=dataset_id,
                product=product_name,
                confidence=result["confidence"],
                forecast_data=forecast_records
            )

            response_data[product_name] = {
                "confidence": result["confidence"],
                "preview": forecast_records[:8],
                "full_forecast": forecast_records 
            }

        return jsonify({"success": True, "results": response_data})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@forecast_bp.route("/download-forecast/<dataset_id>/<product>", methods=["GET"])
def download_forecast(dataset_id, product):
    try:
        dataset_id = dataset_id.strip()
        product = product.strip()

        forecast = Forecast.get_product_forecast(dataset_id, product)
        if not forecast:
            return jsonify({"success": False, "message": "Forecast not found"}), 404

        df = pd.DataFrame(forecast["forecast_data"])
        csv_data = df.to_csv(index=False)

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=forecast_{dataset_id}_{product}.csv"}
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
from utils.jwt_helper import token_required

@forecast_bp.route("/user-forecasts", methods=["GET"])
@token_required
def get_user_forecasts(current_user):
    try:
        # 1. Get all datasets owned by this user
        user_datasets = Dataset.get_user_datasets(current_user)
        dataset_map = {ds["dataset_id"]: ds["original_filename"] for ds in user_datasets}
        
        if not dataset_map:
            return jsonify({"success": True, "forecasts": []})

        # 2. Fetch all forecasts tied to those dataset IDs
        dataset_ids = list(dataset_map.keys())
        user_forecasts = list(db.forecasts.find({"dataset_id": {"$in": dataset_ids}}, {"_id": 0}))

        # 3. Format the response
        history = []
        for f in user_forecasts:
            # Safely handle dates depending on how they were saved
            created_at = f.get("created_at")
            date_str = created_at.strftime("%b %d, %Y - %H:%M") if hasattr(created_at, "strftime") else "Recently"

            history.append({
                "dataset_name": dataset_map.get(f["dataset_id"], "Unknown Dataset"),
                "dataset_id": f["dataset_id"],
                "product": f["product"],
                "confidence": f.get("confidence", "N/A"),
                "date": date_str
            })
        
        # Sort newest first
        history.sort(key=lambda x: x["date"], reverse=True)

        return jsonify({"success": True, "forecasts": history})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500