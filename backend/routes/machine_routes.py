"""
VendAI — Machine Routes
Handles: list machines, add machine, get machine by ID
"""

from flask import Blueprint, request, jsonify
from supabase_client import supabase_admin

machine_bp = Blueprint('machines', __name__)


def get_user_id(req):
    return req.headers.get('X-User-ID')


@machine_bp.route('/', methods=['GET'])
def list_machines():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        machines = supabase_admin.table('machines').select('*').eq('vendor_id', user_id).eq('status', 'active').order('created_at', desc=True).execute()
        return jsonify(machines.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@machine_bp.route('/', methods=['POST'])
def add_machine():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    name = data.get('name', '').strip()
    location = data.get('location', '').strip()

    if not name or not location:
        return jsonify({'error': 'Machine name and location are required'}), 400

    try:
        result = supabase_admin.table('machines').insert({
            'vendor_id': user_id,
            'name': name,
            'location': location,
            'status': 'active'
        }).execute()

        return jsonify({'message': 'Machine added', 'machine': result.data[0]}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@machine_bp.route('/<machine_id>', methods=['GET'])
def get_machine(machine_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        machine = supabase_admin.table('machines').select('*').eq('id', machine_id).eq('vendor_id', user_id).single().execute()
        if not machine.data:
            return jsonify({'error': 'Machine not found'}), 404
        return jsonify(machine.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@machine_bp.route('/<machine_id>', methods=['DELETE'])
def deactivate_machine(machine_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase_admin.table('machines').update({'status': 'inactive'}).eq('id', machine_id).eq('vendor_id', user_id).execute()
        return jsonify({'message': 'Machine deactivated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
