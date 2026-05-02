"""
VendAI — AI Smart Vending Machine
Flask Backend — Entry Point
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.machine_routes import machine_bp
from routes.product_routes import product_bp
from routes.upload_routes import upload_bp
from routes.predict_routes import predict_bp
from routes.alert_routes import alert_bp
from routes.insights_routes import insights_bp

def create_app():
    app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
    app.secret_key = os.getenv('FLASK_SECRET_KEY', 'vendai-secret-dev-key')

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(machine_bp, url_prefix='/api/machines')
    app.register_blueprint(product_bp, url_prefix='/api/products')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(predict_bp, url_prefix='/api/predict')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    app.register_blueprint(insights_bp, url_prefix='/api/insights')

    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'VendAI Backend'})

    # Serve frontend pages
    from flask import send_from_directory
    @app.route('/')
    @app.route('/<path:path>')
    def serve_frontend(path='index.html'):
        try:
            return send_from_directory('../frontend', path)
        except Exception:
            return send_from_directory('../frontend', 'index.html')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
