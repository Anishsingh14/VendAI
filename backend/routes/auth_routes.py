"""
VendAI — Auth Routes
Handles: signup, login, logout, forgot password, profile, test alert, email verify
"""

import os
from flask import Blueprint, request, jsonify, session
from supabase_client import supabase, supabase_admin
from utils.email_sender import send_test_alert
from dotenv import load_dotenv

load_dotenv()

auth_bp = Blueprint('auth', __name__)

APP_URL = os.getenv('APP_URL', 'http://localhost:5000')


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name', '').strip()
    city = data.get('city', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not all([name, city, email, password]):
        return jsonify({'error': 'All fields are required'}), 400

    try:
        # Sign up via Supabase Auth with redirect to our verify page
        res = supabase.auth.sign_up({
            'email': email,
            'password': password,
            'options': {
                'email_redirect_to': f'{APP_URL}/verify.html'
            }
        })
        if res.user is None:
            return jsonify({'error': 'Signup failed. Email may already be registered.'}), 400

        user_id = res.user.id

        # Insert vendor profile
        supabase_admin.table('vendors').insert({
            'id': user_id,
            'name': name,
            'city': city,
            'email': email,
            'alert_email': email,
            'alert_email_verified': True
        }).execute()

        return jsonify({'message': 'Signup successful. Check your email to verify your account.'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        res = supabase.auth.sign_in_with_password({'email': email, 'password': password})
        if res.user is None:
            return jsonify({'error': 'Invalid credentials'}), 401

        session['access_token'] = res.session.access_token
        session['user_id'] = res.user.id

        # Fetch vendor profile
        vendor = supabase_admin.table('vendors').select('*').eq('id', res.user.id).single().execute()

        return jsonify({
            'message': 'Login successful',
            'access_token': res.session.access_token,
            'user': {
                'id': res.user.id,
                'email': res.user.email,
                'name': vendor.data.get('name') if vendor.data else '',
                'city': vendor.data.get('city') if vendor.data else '',
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        supabase.auth.sign_out()
        session.clear()
        return jsonify({'message': 'Logged out'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    try:
        supabase.auth.reset_password_email(email, {
            'redirect_to': f'{APP_URL}/reset-password.html'
        })
        return jsonify({'message': 'Password reset link sent to your email'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/change-email', methods=['PUT'])
def change_email():
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    new_email = data.get('email', '').strip().lower()

    if not new_email:
        return jsonify({'error': 'New email is required'}), 400

    try:
        # Update email in Supabase Auth
        supabase_admin.auth.admin.update_user_by_id(user_id, {'email': new_email})

        # Update email in vendors table
        supabase_admin.table('vendors').update({
            'email': new_email,
            'alert_email': new_email
        }).eq('id', user_id).execute()

        return jsonify({'message': f'Email updated to {new_email}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        vendor = supabase_admin.table('vendors').select('*').eq('id', user_id).single().execute()
        return jsonify(vendor.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    if 'city' in data:
        updates['city'] = data['city']

    try:
        supabase_admin.table('vendors').update(updates).eq('id', user_id).execute()
        return jsonify({'message': 'Profile updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/test-alert', methods=['POST'])
def test_alert():
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        vendor = supabase_admin.table('vendors').select('alert_email, name').eq('id', user_id).single().execute()
        alert_email = vendor.data.get('alert_email')
        name = vendor.data.get('name', 'Vendor')

        if not alert_email:
            return jsonify({'error': 'No alert email configured'}), 400

        send_test_alert(alert_email, name)
        return jsonify({'message': f'Test alert sent to {alert_email}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
