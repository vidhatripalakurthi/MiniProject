import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from utils.preprocess import preprocess_dataset
from models.dataset_model import Dataset
from utils.jwt_helper import token_required

dataset_bp = Blueprint("dataset", __name__)

# Base directory of backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
CLEAN_FOLDER = os.path.join(BASE_DIR, "cleandata")

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLEAN_FOLDER, exist_ok=True)


@dataset_bp.route("/upload-dataset", methods=["POST"])
@token_required
def upload_dataset(current_user):

    try:
        # Check if file exists in request
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files.get("file")

        if file is None:
            return jsonify({"error": "No file uploaded"}), 400

        filename = secure_filename(file.filename)

        upload_path = os.path.join(UPLOAD_FOLDER, filename)

        # Save uploaded file
        with open(upload_path, "wb") as f:
            f.write(file.read())

        print("Uploaded file saved to:", upload_path)

        # -----------------------------
        # Run preprocessing
        # -----------------------------
        result = preprocess_dataset(upload_path)

        if result["status"] == "error":
            return jsonify({"error": result["message"]}), 400

        df = result["data"]

        # -----------------------------
        # Generate dataset ID
        # -----------------------------
        dataset_id = str(uuid.uuid4())

        clean_filename = f"dataset_{dataset_id}.csv"
        clean_path = os.path.join(CLEAN_FOLDER, clean_filename)

        # Save cleaned dataset
        df.to_csv(clean_path, index=False)

        # -----------------------------
        # Extract metadata
        # -----------------------------
        products = df["Product"].unique().tolist()

        date_range = {
            "start": str(df["Date"].min()),
            "end": str(df["Date"].max())
        }

        preview = df.head(10).to_dict(orient="records")

        # -----------------------------
        # Save metadata to MongoDB
        # -----------------------------
        Dataset.create_dataset(
            user_id=current_user,   # JWT user id
            dataset_id=dataset_id,
            original_filename=filename,
            clean_file=clean_filename,
            rows=len(df),
            products=products,
            date_range=date_range
        )

        return jsonify({
            "message": "Dataset processed successfully",
            "dataset_id": dataset_id,
            "clean_file": clean_filename,
            "rows": len(df),
            "products": products,
            "date_range": date_range,
            "preview": preview
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500