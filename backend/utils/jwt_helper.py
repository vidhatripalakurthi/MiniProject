import jwt
from flask import request, jsonify
from functools import wraps
from config import JWT_SECRET


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = None

        # Read Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]

            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"message": "Token missing"}), 401

        try:
            # Decode token using SAME secret as login
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

            current_user = data["user_id"]

            print("JWT decoded user:", current_user)

        except Exception as e:
            print("JWT decode error:", e)
            return jsonify({"message": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated