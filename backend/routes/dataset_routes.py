import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import pandas as pd

from utils.preprocess import preprocess_dataset
from models.dataset_model import Dataset
from config import db
from utils.jwt_helper import token_required

dataset_bp = Blueprint("dataset", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
CLEAN_FOLDER = os.path.join(BASE_DIR, "cleandata")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLEAN_FOLDER, exist_ok=True)

@dataset_bp.route("/upload-dataset", methods=["POST"])
@token_required
def upload_dataset(current_user):
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file uploaded"}), 400

        file = request.files.get("file")
        if file.filename == "":
            return jsonify({"success": False, "message": "Empty filename"}), 400

        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(upload_path)

        result = preprocess_dataset(upload_path)
        if result["status"] == "error":
            return jsonify({"success": False, "message": result["message"]}), 400

        df = result["data"]
        
        # We will let the DB assign or reuse the ID first to name the file properly
        existing = db.datasets.find_one({"user_id": current_user, "original_filename": filename})
        dataset_id = existing["dataset_id"] if existing else str(uuid.uuid4())
        
        clean_filename = f"dataset_{dataset_id}.csv"
        clean_path = os.path.join(CLEAN_FOLDER, clean_filename)
        df.to_csv(clean_path, index=False)

        products = df["Product"].unique().tolist()
        date_range = {"start": str(df["Date"].min()), "end": str(df["Date"].max())}
        preview = df.head(10).to_dict(orient="records")

        # Use the new UPSERT function
        final_dataset_id = Dataset.upsert_dataset(
            user_id=current_user,
            original_filename=filename,
            clean_file=clean_filename,
            rows=len(df),
            products=products,
            date_range=date_range
        )

        return jsonify({
            "success": True,
            "message": "Dataset processed successfully",
            "dataset_id": final_dataset_id,
            "clean_file": clean_filename,
            "rows": len(df),
            "products": products,
            "date_range": date_range,
            "preview": preview
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@dataset_bp.route("/cleandata/<filename>", methods=["GET"])
def download_clean_dataset(filename):
    try:
        return send_from_directory(CLEAN_FOLDER, filename, as_attachment=True)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 404


@dataset_bp.route("/history/<dataset_id>/<product>", methods=["GET"])
@token_required
def get_product_history(current_user, dataset_id, product):
    try:
        dataset = Dataset.get_dataset_by_id(dataset_id)
        if not dataset:
            return jsonify({"success": False, "message": "Dataset not found"}), 404

        clean_path = os.path.join(CLEAN_FOLDER, dataset["clean_file"])
        df = pd.read_csv(clean_path)

        product_df = df[df["Product"] == product].copy()
        product_df["Date"] = pd.to_datetime(product_df["Date"])
        product_df = product_df.sort_values("Date")

        history_df = product_df.tail(20)
        history_data = [{"time": row["Date"].strftime("%d-%m-%Y"), "actual": float(row["Demand"])} for _, row in history_df.iterrows()]

        return jsonify({"success": True, "history": history_data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------
# NEW: DASHBOARD STATS ROUTE
# -----------------------------
@dataset_bp.route("/dashboard-stats", methods=["GET"])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Count unique datasets for this user
        user_datasets = list(db.datasets.find({"user_id": current_user}))
        unique_datasets_count = len(user_datasets)
        
        # Get all dataset IDs owned by this user
        dataset_ids = [ds["dataset_id"] for ds in user_datasets]
        
        # Count unique forecasts tied to this user's datasets (grouped by dataset_id + product)
        # Using distinct isn't enough for multi-field, so we count documents since we upserted them
        unique_forecasts_count = db.forecasts.count_documents({"dataset_id": {"$in": dataset_ids}})

        return jsonify({
            "success": True,
            "unique_datasets": unique_datasets_count,
            "unique_forecasts": unique_forecasts_count
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500