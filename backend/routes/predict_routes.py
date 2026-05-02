"""
VendAI — Prediction Routes
Handles: get predictions for a product (calendar view), trigger retraining
"""

from flask import Blueprint, request, jsonify
from supabase_client import supabase_admin
from models.predictor import get_product_calendar

predict_bp = Blueprint('predict', __name__)


def get_user_id(req):
    return req.headers.get('X-User-ID')


@predict_bp.route('/calendar', methods=['GET'])
def product_calendar():
    """
    Returns calendar predictions for a product.
    Query params: machine_id, product_name
    """
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    machine_id = request.args.get('machine_id')
    product_name = request.args.get('product_name')

    if not machine_id or not product_name:
        return jsonify({'error': 'machine_id and product_name are required'}), 400

    try:
        calendar_data = get_product_calendar(machine_id, product_name, user_id)
        return jsonify(calendar_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@predict_bp.route('/retrain', methods=['POST'])
def retrain():
    """Manually trigger model retraining for a machine."""
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    machine_id = data.get('machine_id')

    if not machine_id:
        return jsonify({'error': 'machine_id required'}), 400

    try:
        from models.trainer import train_models_for_machine
        train_models_for_machine(machine_id, user_id)
        return jsonify({'message': 'Retraining triggered successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
