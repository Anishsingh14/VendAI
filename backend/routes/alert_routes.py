"""
VendAI — Alert Routes
Handles: get active alerts for a vendor, dismiss alert
"""

from flask import Blueprint, request, jsonify
from supabase_client import supabase_admin

alert_bp = Blueprint('alerts', __name__)


def get_user_id(req):
    return req.headers.get('X-User-ID')


@alert_bp.route('/', methods=['GET'])
def get_alerts():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        alerts = supabase_admin.table('alert_log') \
            .select('*') \
            .eq('vendor_id', user_id) \
            .order('sent_at', desc=True) \
            .limit(50) \
            .execute()
        return jsonify(alerts.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
