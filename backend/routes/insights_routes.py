"""
VendAI — Insights Routes
Top/bottom sellers, seasonal patterns per machine
"""

from flask import Blueprint, request, jsonify
from supabase_client import supabase_admin
from utils.insights_engine import compute_insights

insights_bp = Blueprint('insights', __name__)


def get_user_id(req):
    return req.headers.get('X-User-ID')


@insights_bp.route('/<machine_id>', methods=['GET'])
def get_insights(machine_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        insights = compute_insights(machine_id, user_id)
        return jsonify(insights), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
