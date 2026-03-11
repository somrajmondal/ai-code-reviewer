import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Register blueprints
from backend.routes.review  import review_bp
from backend.routes.history import history_bp
from backend.routes.meta    import meta_bp


load_dotenv()

def create_app():
    app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(review_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(meta_bp)

    # Serve React SPA
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        build = os.path.join(app.root_path, "../frontend/build")
        full  = os.path.join(build, path)
        if path and os.path.exists(full):
            return send_from_directory(build, path)
        return send_from_directory(build, "index.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
