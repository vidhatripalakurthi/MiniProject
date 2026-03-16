import os
import pandas as pd
from flask import Blueprint, request, jsonify, Response

from ml.forecast_pipeline import run_forecast_pipeline
from models.dataset_model import Dataset
from config import db
from models.forecast_model import Forecast
forecast_bp = Blueprint("forecast", __name__)

# -----------------------------
# GENERATE FORECAST API
# -----------------------------

@forecast_bp.route("/generate-forecast", methods=["POST"])
def generate_forecast():

    try:

        data = request.json

        dataset_id = data.get("dataset_id")
        product = data.get("product")

        if not dataset_id:
            return jsonify({
                "success": False,
                "message": "dataset_id is required"
            }), 400

        # -----------------------------
        # GET DATASET
        # -----------------------------

        dataset = Dataset.get_dataset_by_id(dataset_id)

        if not dataset:
            return jsonify({
                "success": False,
                "message": "Dataset not found"
            }), 404

        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        clean_path = os.path.join(BASE_DIR, "cleandata", dataset["clean_file"])

        # -----------------------------
        # RUN ML PIPELINE
        # -----------------------------

        results = run_forecast_pipeline(
            file_path=clean_path,
            selected_product=product
        )

        response_data = {}

        for product_name, result in results.items():

            forecast_values = result["forecast"]

            # -----------------------------
            # GET LAST DATE
            # -----------------------------

            df = pd.read_csv(clean_path)
            df["Date"] = pd.to_datetime(df["Date"])

            last_date = df["Date"].max()

            future_dates = pd.date_range(
                start=last_date + pd.Timedelta(weeks=1),
                periods=len(forecast_values),
                freq="W"
            )

            # -----------------------------
            # CREATE FORECAST DATAFRAME
            # -----------------------------

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

            # -----------------------------
            # STORE FORECAST IN DB
            # -----------------------------

            Forecast.create_forecast(
            dataset_id=dataset_id,
            product=product_name,
            confidence=result["confidence"],
            forecast_data=forecast_records
             )

            # -----------------------------
            # PREVIEW DATA
            # -----------------------------

            preview = forecast_records[:8]

            response_data[product_name] = {
                "confidence": result["confidence"],
                "preview": preview
            }

        return jsonify({
            "success": True,
            "results": response_data
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
@forecast_bp.route("/download-forecast/<dataset_id>/<product>", methods=["GET"])
def download_forecast(dataset_id, product):

    try:

        dataset_id = dataset_id.strip()
        product = product.strip()

        forecast = Forecast.get_product_forecast(dataset_id, product)

        if not forecast:
            return jsonify({
                "success": False,
                "message": f"Forecast not found for dataset {dataset_id} and product {product}"
            }), 404

        forecast_data = forecast["forecast_data"]

        df = pd.DataFrame(forecast_data)

        csv_data = df.to_csv(index=False)

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={
                "Content-Disposition":
                f"attachment; filename=forecast_{dataset_id}_{product}.csv"
            }
        )

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500