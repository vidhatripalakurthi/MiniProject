from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import random

from models.user_model import User
from config import JWT_SECRET, db
from utils.email_sender import send_otp_email

auth_bp = Blueprint("auth", __name__)


# -----------------------------
# REGISTER API (UNCHANGED)
# -----------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    business_type = data.get("business_type")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    if User.find_by_email(email):
        return jsonify({
            "success": False,
            "message": "User already exists with this email"
        }), 409

    User.create_user(
        name=name,
        email=email,
        password=password,
        business_type=business_type
    )

    return jsonify({
        "success": True,
        "message": "User registered successfully"
    }), 201


# -----------------------------
# LOGIN API (UNCHANGED)
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    user = User.find_by_email(email)

    if not user or not User.check_password(password, user["password"]):
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    token = jwt.encode(
        {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        JWT_SECRET,
        algorithm="HS256"
    )

    return jsonify({
        "success": True,
        "token": token
    }), 200


# -----------------------------
# OTP GENERATOR
# -----------------------------
def generate_otp():
    return str(random.randint(100000, 999999))


# -----------------------------
# FORGOT PASSWORD – SEND OTP
# -----------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():

    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({
            "success": False,
            "message": "Email is required"
        }), 400

    user = User.find_by_email(email)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    otp = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)

    db.otp_requests.delete_many({"email": email})

    db.otp_requests.insert_one({
        "email": email,
        "otp": otp,
        "expires_at": expiry
    })

    # SEND OTP EMAIL
    email_sent = send_otp_email(email, otp)

    if not email_sent:
        return jsonify({
            "success": False,
            "message": "Failed to send OTP email"
        }), 500

    return jsonify({
        "success": True,
        "message": "OTP sent to your email"
    }), 200


# -----------------------------
# RESET PASSWORD
# -----------------------------
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():

    data = request.get_json()

    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")

    if not email or not otp or not new_password:
        return jsonify({
            "success": False,
            "message": "Email, OTP and new password are required"
        }), 400

    record = db.otp_requests.find_one({
        "email": email,
        "otp": otp
    })

    if not record:
        return jsonify({
            "success": False,
            "message": "Invalid OTP"
        }), 400

    if record["expires_at"] < datetime.utcnow():

        db.otp_requests.delete_one({
            "_id": record["_id"]
        })

        return jsonify({
            "success": False,
            "message": "OTP expired"
        }), 400

    hashed_password = User.hash_password(new_password)

    db.users.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )

    db.otp_requests.delete_one({
        "_id": record["_id"]
    })

    return jsonify({
        "success": True,
        "message": "Password reset successful"
    }), 200