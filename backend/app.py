from flask import Flask
from config import db
from routes.auth_routes import auth_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# register auth routes
app.register_blueprint(auth_bp, url_prefix="/auth")

@app.route("/")
def health_check():
    db.users.find_one()
    return {"status": "Backend + DB connected"}

if __name__ == "__main__":
    app.run(debug=True)