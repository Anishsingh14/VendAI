"""
VendAI — Product Routes
Handles: list products, add, deactivate, restore, tag priority, change log
"""

from flask import Blueprint, request, jsonify
from supabase_client import supabase_admin
from datetime import datetime, timezone, timedelta

product_bp = Blueprint('products', __name__)

PRIORITY_CATEGORIES = ['sanitary', 'medication', 'first-aid']


def get_user_id(req):
    return req.headers.get('X-User-ID')


@product_bp.route('/machine/<machine_id>', methods=['GET'])
def list_products(machine_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        # Step 1: fetch products
        products_res = supabase_admin.table('products') \
            .select('*') \
            .eq('machine_id', machine_id) \
            .order('is_priority', desc=True) \
            .order('product_name') \
            .execute()

        products = products_res.data or []

        # Step 2: fetch latest prediction per product for this machine
        preds_res = supabase_admin.table('predictions') \
            .select('product_name, prediction_date, predicted_stock, stock_status, confidence_level, model_confidence_score') \
            .eq('machine_id', machine_id) \
            .order('prediction_date', desc=True) \
            .execute()

        # Build a lookup: product_name → latest prediction row
        pred_map = {}
        for row in (preds_res.data or []):
            name = row['product_name']
            if name not in pred_map:   # already sorted desc, so first = latest
                pred_map[name] = row

        # Merge predictions into products
        for p in products:
            p['latest_prediction'] = pred_map.get(p['product_name'])

        return jsonify(products), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@product_bp.route('/', methods=['POST'])
def add_product():
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    machine_id = data.get('machine_id')
    product_name = data.get('product_name', '').strip()
    category = data.get('category', 'other').strip().lower()
    is_priority = data.get('is_priority', False) or any(p in category for p in PRIORITY_CATEGORIES)

    # Cold start parameters (FR-23)
    current_stock = data.get('current_stock', 50)
    estimated_daily_sales = data.get('estimated_daily_sales', 5)
    max_capacity = data.get('max_capacity', 100)

    if not machine_id or not product_name:
        return jsonify({'error': 'machine_id and product_name are required'}), 400

    try:
        result = supabase_admin.table('products').insert({
            'machine_id': machine_id,
            'vendor_id': user_id,
            'product_name': product_name,
            'category': category,
            'is_priority': is_priority,
            'status': 'active',
            'data_confidence': 'low',
            'model_confidence': 0.3
        }).execute()

        product_id = result.data[0]['id']

        # Log the change
        supabase_admin.table('product_change_log').insert({
            'product_id': product_id,
            'machine_id': machine_id,
            'vendor_id': user_id,
            'change_type': 'added',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }).execute()

        # Generate cold start predictions (FR-22, FR-23)
        _generate_cold_start(machine_id, user_id, product_name,
                             current_stock, estimated_daily_sales, max_capacity,
                             product_id)

        return jsonify({'message': 'Product added', 'product': result.data[0]}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _generate_cold_start(machine_id, vendor_id, product_name,
                         current_stock, estimated_daily_sales, max_capacity,
                         product_id):
    """Generate 30-day cold start predictions for a manually added product."""
    from datetime import date as dt_date
    stock = float(current_stock)
    capacity = float(max_capacity) if max_capacity > 0 else 100
    daily = float(estimated_daily_sales) if estimated_daily_sales > 0 else 1.0
    today = dt_date.today()
    records = []
    first_yellow = None
    first_red = None

    for day_offset in range(0, 31):
        pred_date = today + timedelta(days=day_offset)
        if day_offset > 0:
            stock = max(0, stock - daily)
        pct = stock / capacity * 100

        if pct > 50:
            status = 'green'
        elif pct > 20:
            status = 'yellow'
            if first_yellow is None:
                first_yellow = pred_date.isoformat()
        elif pct > 0:
            status = 'red'
            if first_red is None:
                first_red = pred_date.isoformat()
        else:
            status = 'black'
            if first_red is None:
                first_red = pred_date.isoformat()

        records.append({
            'machine_id': machine_id,
            'vendor_id': vendor_id,
            'product_name': product_name,
            'prediction_date': pred_date.isoformat(),
            'predicted_stock': round(stock, 2),
            'stock_status': status,
            'confidence_level': 'low',
            'model_confidence_score': 0.3
        })

    try:
        for chunk in [records[i:i+100] for i in range(0, len(records), 100)]:
            supabase_admin.table('predictions').upsert(
                chunk, on_conflict='machine_id,product_name,prediction_date'
            ).execute()

        # Update product with alert dates
        supabase_admin.table('products').update({
            'first_yellow_date': first_yellow,
            'first_red_date': first_red
        }).eq('id', product_id).execute()
    except Exception:
        pass


@product_bp.route('/<product_id>/deactivate', methods=['POST'])
def deactivate_product(product_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        product = supabase_admin.table('products').select('machine_id').eq('id', product_id).single().execute()
        supabase_admin.table('products').update({'status': 'inactive'}).eq('id', product_id).eq('vendor_id', user_id).execute()
        supabase_admin.table('product_change_log').insert({
            'product_id': product_id,
            'machine_id': product.data.get('machine_id'),
            'vendor_id': user_id,
            'change_type': 'deactivated',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }).execute()
        return jsonify({'message': 'Product deactivated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@product_bp.route('/<product_id>/restore', methods=['POST'])
def restore_product(product_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        product = supabase_admin.table('products').select('machine_id').eq('id', product_id).single().execute()
        supabase_admin.table('products').update({'status': 'active'}).eq('id', product_id).eq('vendor_id', user_id).execute()
        supabase_admin.table('product_change_log').insert({
            'product_id': product_id,
            'machine_id': product.data.get('machine_id'),
            'vendor_id': user_id,
            'change_type': 'restored',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }).execute()
        return jsonify({'message': 'Product restored'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@product_bp.route('/<product_id>/priority', methods=['POST'])
def toggle_priority(product_id):
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    is_priority = data.get('is_priority', True)

    try:
        supabase_admin.table('products').update({'is_priority': is_priority}).eq('id', product_id).eq('vendor_id', user_id).execute()
        return jsonify({'message': f"Product priority set to {is_priority}"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@product_bp.route('/restock', methods=['POST'])
def restock_product():
    """Record a restock event: update stock, add inventory row, retrain model."""
    user_id = get_user_id(request)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    machine_id = data.get('machine_id')
    product_name = data.get('product_name')
    restock_qty = data.get('restock_qty', 0)

    if not machine_id or not product_name or restock_qty <= 0:
        return jsonify({'error': 'machine_id, product_name, and restock_qty (>0) required'}), 400

    try:
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

        # Get current stock
        product_res = supabase_admin.table('products') \
            .select('id, stock_remaining') \
            .eq('machine_id', machine_id) \
            .eq('product_name', product_name) \
            .single().execute()

        current_stock = float(product_res.data.get('stock_remaining') or 0)
        new_stock = current_stock + float(restock_qty)

        # Update product stock
        supabase_admin.table('products').update({
            'stock_remaining': new_stock
        }).eq('id', product_res.data['id']).execute()

        # Add inventory data row for the restock
        supabase_admin.table('inventory_data').upsert({
            'machine_id': machine_id,
            'vendor_id': user_id,
            'product_name': product_name,
            'date': today,
            'stock_added': float(restock_qty),
            'units_consumed': 0,
            'stock_remaining': new_stock,
            'day_of_week': datetime.now(timezone.utc).strftime('%A'),
            'month': datetime.now(timezone.utc).strftime('%B')
        }, on_conflict='machine_id,product_name,date').execute()

        # Log the restock
        supabase_admin.table('product_change_log').insert({
            'product_id': product_res.data['id'],
            'machine_id': machine_id,
            'vendor_id': user_id,
            'change_type': 'restocked',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }).execute()

        # Re-trigger training so predictions update with new stock level
        try:
            from models.trainer import train_model_for_product
            from utils.alert_engine import reset_alert_counter
            reset_alert_counter(machine_id)
            # Run synchronously for this specific product to ensure UI updates immediately
            train_model_for_product(machine_id, user_id, product_name)
        except Exception as train_err:
            print(f"[Restock] Retraining failed to start: {train_err}")

        return jsonify({
            'message': f'Restocked {product_name} with {restock_qty} units',
            'new_stock': new_stock
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
