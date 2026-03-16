from flask import Flask, request, jsonify
from flask_cors import CORS
from config import db

# Import routes
from routes.auth_routes import auth_bp
from routes.dataset_routes import dataset_bp
from routes.forecast_routes import forecast_bp
app = Flask(__name__)

# Enable CORS
CORS(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(dataset_bp)
app.register_blueprint(forecast_bp)


# Health check route
@app.route("/")
def health_check():
    db.users.find_one()
    return {"status": "Backend + DB connected"}


if __name__ == "__main__":
    app.run(debug=True)

