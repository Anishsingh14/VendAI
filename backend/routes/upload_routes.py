"""
VendAI — CSV Upload & Column Mapper Routes
Handles: file upload, column detection, mapping, data ingestion, health report
"""

import os
import uuid
import math
import numpy as np
from flask import Blueprint, request, jsonify
from supabase_client import supabase_admin
import pandas as pd
from utils.data_repair import repair_dataframe, detect_columns
from models.trainer import train_models_for_machine

upload_bp = Blueprint('upload', __name__)

REQUIRED_COLUMNS = ['date', 'product_name', 'stock_remaining', 'units_consumed', 'stock_added']
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../../data/uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Only these columns exist in inventory_data table — everything else is stripped
INVENTORY_COLUMNS = {
    'date', 'product_name', 'stock_added',
    'units_consumed', 'stock_remaining', 'day_of_week', 'month'
}


def get_user_id(req):
    return req.headers.get('X-User-ID')


def sanitize_record(record: dict) -> dict:
    """Replace NaN/Inf float values with None so they are JSON-safe for Supabase."""
    clean = {}
    for k, v in record.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            clean[k] = None
        elif isinstance(v, np.integer):
            clean[k] = int(v)
        elif isinstance(v, np.floating):
            fv = float(v)
            clean[k] = None if (math.isnan(fv) or math.isinf(fv)) else fv
        elif isinstance(v, np.bool_):
            clean[k] = bool(v)
        else:
            clean[k] = v
    return clean


@upload_bp.route('/detect-columns', methods=['POST'])
def detect_columns_route():
    """Step 1: Upload file, detect columns, return for user mapping."""
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(filepath, nrows=5)
        else:
            df = pd.read_csv(filepath, nrows=5)

        detected = detect_columns(df.columns.tolist())
        return jsonify({
            'temp_filename': filename,
            'file_columns': df.columns.tolist(),
            'auto_detected_mapping': detected,
            'required_fields': REQUIRED_COLUMNS
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to read file: {str(e)}'}), 400


@upload_bp.route('/process', methods=['POST'])
def process_upload():
    """Step 2: Apply user mapping, repair data, ingest, trigger training."""
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    temp_filename = data.get('temp_filename')
    machine_id = data.get('machine_id')
    column_mapping = data.get('column_mapping', {})

    if not temp_filename or not machine_id:
        return jsonify({'error': 'temp_filename and machine_id are required'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, temp_filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Temp file not found. Please re-upload.'}), 400

    try:
        # Load file
        if filepath.endswith('.xlsx') or filepath.endswith('.xls'):
            df = pd.read_excel(filepath)
        else:
            df = pd.read_csv(filepath)

        # Apply user's column mapping
        df = df.rename(columns={v: k for k, v in column_mapping.items() if v})

        # Repair: gap-fill, dedup, derive features
        df, repair_report = repair_dataframe(df, machine_id)

        # Fix NaN/Inf BEFORE any JSON/Supabase operation
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notnull(df), None)

        # Strip columns not in inventory_data schema
        # (CSV extras like 'location', 'machine_id' text, 'notes' must be dropped)
        cols_to_drop = [c for c in df.columns if c not in INVENTORY_COLUMNS]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)
            repair_report['stripped_columns'] = cols_to_drop

        # Check for zero-stock products (triggers urgent alert)
        if 'stock_remaining' in df.columns:
            zero_stock = df[df['stock_remaining'] == 0]['product_name'].dropna().unique().tolist()
        else:
            zero_stock = []

        # Sanitize records and upsert to Supabase in chunks of 500
        raw_records = df.to_dict('records')
        records = [sanitize_record(r) for r in raw_records]
        rows_loaded = 0
        for chunk in [records[i:i+500] for i in range(0, len(records), 500)]:
            supabase_admin.table('inventory_data').upsert(
                [{**r, 'machine_id': machine_id, 'vendor_id': user_id} for r in chunk],
                on_conflict='machine_id,product_name,date'
            ).execute()
            rows_loaded += len(chunk)

        # Auto-detect and upsert products with latest stock from CSV
        products_in_file = [str(p) for p in df['product_name'].dropna().unique().tolist()]
        for pname in products_in_file:
            pname_lower = pname.lower()
            is_priority = any(kw in pname_lower for kw in [
                'pad', 'tampon', 'liner', 'paracetamol', 'bandage',
                'antacid', 'pain', 'medication', 'sanitary'
            ])
            # Get latest stock for this product from the uploaded data
            product_rows = df[df['product_name'] == pname].copy()
            product_rows['date'] = pd.to_datetime(product_rows['date'])
            product_rows = product_rows.sort_values('date')
            latest_stock = None
            if 'stock_remaining' in product_rows.columns and not product_rows.empty:
                latest_stock = product_rows['stock_remaining'].iloc[-1]
                try:
                    latest_stock = float(latest_stock) if latest_stock is not None and not pd.isna(latest_stock) else None
                except (ValueError, TypeError):
                    latest_stock = None

            upsert_data = {
                'machine_id': machine_id,
                'vendor_id': user_id,
                'product_name': pname,
                'is_priority': is_priority,
                'status': 'active'
            }
            if latest_stock is not None:
                upsert_data['stock_remaining'] = latest_stock

            supabase_admin.table('products').upsert(
                upsert_data, on_conflict='machine_id,product_name'
            ).execute()

        # Update machine last_upload timestamp
        supabase_admin.table('machines').update(
            {'last_upload_at': pd.Timestamp.now(tz='UTC').isoformat()}
        ).eq('id', machine_id).execute()

        # Reset alert counter for this machine before training (prevent spam)
        from utils.alert_engine import reset_alert_counter
        reset_alert_counter(machine_id)

        # Trigger model training
        try:
            train_models_for_machine(machine_id, user_id)
        except Exception as train_err:
            repair_report['training_error'] = str(train_err)

        # Fire ONE consolidated zero-stock alert (not per-product spam)
        if zero_stock and len(zero_stock) > 0:
            from utils.email_sender import send_urgent_stockout_alert
            try:
                vendor = supabase_admin.table('vendors').select('alert_email, name').eq('id', user_id).single().execute()
                machine = supabase_admin.table('machines').select('name, location').eq('id', machine_id).single().execute()
                # Send ONE email with the first zero-stock product (most critical)
                # The model training will handle individual alerts via alert_engine with rate limiting
                send_urgent_stockout_alert(
                    to_email=vendor.data['alert_email'],
                    vendor_name=vendor.data['name'],
                    machine_name=machine.data['name'],
                    machine_location=machine.data['location'],
                    product_name=', '.join(zero_stock[:3]) + (f' (+{len(zero_stock)-3} more)' if len(zero_stock) > 3 else '')
                )
            except Exception:
                pass

        # Cleanup temp file
        try:
            os.remove(filepath)
        except Exception:
            pass

        return jsonify({
            'message': 'Data uploaded and processing complete',
            'rows_loaded': rows_loaded,
            'products_detected': len(products_in_file),
            'zero_stock_alerts': zero_stock,
            'health_report': repair_report
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
