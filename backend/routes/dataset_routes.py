import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from utils.preprocess import preprocess_dataset
from models.dataset_model import Dataset
from utils.jwt_helper import token_required

dataset_bp = Blueprint("dataset", __name__)

# -----------------------------
# PATH CONFIGURATION
# -----------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
CLEAN_FOLDER = os.path.join(BASE_DIR, "cleandata")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLEAN_FOLDER, exist_ok=True)


# -----------------------------
# UPLOAD DATASET API
# -----------------------------

@dataset_bp.route("/upload-dataset", methods=["POST"])
@token_required
def upload_dataset(current_user):

    try:

        # -----------------------------
        # CHECK FILE
        # -----------------------------
        if "file" not in request.files:
            return jsonify({
                "success": False,
                "message": "No file uploaded"
            }), 400

        file = request.files.get("file")

        if file.filename == "":
            return jsonify({
                "success": False,
                "message": "Empty filename"
            }), 400

        filename = secure_filename(file.filename)

        upload_path = os.path.join(UPLOAD_FOLDER, filename)

        # -----------------------------
        # SAVE UPLOADED FILE
        # -----------------------------
        file.save(upload_path)

        print("Uploaded file saved to:", upload_path)

        # -----------------------------
        # PREPROCESS DATASET
        # -----------------------------
        result = preprocess_dataset(upload_path)

        if result["status"] == "error":

            return jsonify({
                "success": False,
                "message": result["message"]
            }), 400

        df = result["data"]

        # -----------------------------
        # GENERATE DATASET ID
        # -----------------------------
        dataset_id = str(uuid.uuid4())

        clean_filename = f"dataset_{dataset_id}.csv"
        clean_path = os.path.join(CLEAN_FOLDER, clean_filename)

        # -----------------------------
        # SAVE CLEANED DATASET
        # -----------------------------
        df.to_csv(clean_path, index=False)

        print("Clean dataset saved:", clean_path)

        # -----------------------------
        # METADATA EXTRACTION
        # -----------------------------
        products = df["Product"].unique().tolist()

        date_range = {
            "start": str(df["Date"].min()),
            "end": str(df["Date"].max())
        }

        preview = df.head(10).to_dict(orient="records")

        # -----------------------------
        # STORE METADATA IN DB
        # -----------------------------
        Dataset.create_dataset(
            user_id=current_user,
            dataset_id=dataset_id,
            original_filename=filename,
            clean_file=clean_filename,
            rows=len(df),
            products=products,
            date_range=date_range
        )

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return jsonify({
            "success": True,
            "message": "Dataset processed successfully",
            "dataset_id": dataset_id,
            "clean_file": clean_filename,
            "rows": len(df),
            "products": products,
            "date_range": date_range,
            "preview": preview
        })

    except Exception as e:

        print("Dataset upload error:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# -----------------------------
# DOWNLOAD CLEAN DATASET
# -----------------------------

@dataset_bp.route("/cleandata/<filename>", methods=["GET"])
def download_clean_dataset(filename):

    try:
        return send_from_directory(
            CLEAN_FOLDER,
            filename,
            as_attachment=True
        )
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 404