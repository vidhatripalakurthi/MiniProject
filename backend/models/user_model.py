from datetime import datetime
from flask_bcrypt import Bcrypt
from config import db

bcrypt = Bcrypt()

class User:
    @staticmethod
    def hash_password(password):
        return bcrypt.generate_password_hash(password).decode("utf-8")

    @staticmethod
    def check_password(password, hashed_password):
        return bcrypt.check_password_hash(hashed_password, password)

    @staticmethod
    def create_user(name, email, password, business_type=None):
        user = {
            "name": name,
            "email": email,
            "password": User.hash_password(password),
            "business_type": business_type,
            "is_verified": True,
            "created_at": datetime.utcnow()
        }
        db.users.insert_one(user)
        return user

    @staticmethod
    def find_by_email(email):
        return db.users.find_one({"email": email})