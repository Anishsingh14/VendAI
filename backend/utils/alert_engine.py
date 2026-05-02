"""
VendAI — Alert Engine
Checks if an alert should fire (dedup within 24h) and sends it.
Includes batch limiting to prevent spam: max 3 alerts per machine per upload.
"""

from datetime import datetime, timezone, timedelta
from supabase_client import supabase_admin
from utils.email_sender import send_warning_alert, send_critical_alert

# Track alerts fired per-upload to prevent spam
_upload_alert_counter = {}


def reset_alert_counter(machine_id):
    """Reset per-upload counter. Call this at start of each upload."""
    _upload_alert_counter[machine_id] = 0


def check_and_fire_alerts(machine_id, vendor_id, product_name, is_priority, first_yellow_date, first_red_date):
    """Fire threshold alerts if not already sent within 24h.
    
    Rate limits:
    - Max 3 email alerts per machine per upload session
    - 24-hour cooldown per product+level combination
    - Priority products bypass the per-upload limit
    """
    # Per-upload rate limiting (skip for priority products)
    current_count = _upload_alert_counter.get(machine_id, 0)
    if current_count >= 3 and not is_priority:
        print(f"[AlertEngine] Skipping alert for {product_name} — batch limit reached ({current_count} alerts sent)")
        return

    vendor = supabase_admin.table('vendors').select('alert_email, name').eq('id', vendor_id).single().execute()
    machine = supabase_admin.table('machines').select('name, location').eq('id', machine_id).single().execute()
    products = supabase_admin.table('products').select('stock_remaining').eq('machine_id', machine_id).eq('product_name', product_name).single().execute()

    if not vendor.data or not machine.data:
        return

    alert_email = vendor.data.get('alert_email')
    vendor_name = vendor.data.get('name', 'Vendor')
    machine_name = machine.data.get('name', machine_id)
    machine_location = machine.data.get('location', 'Unknown')
    current_stock = (products.data or {}).get('stock_remaining', 'N/A')

    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(hours=24)).isoformat()
    alert_sent = False

    # For non-priority: only send the most critical alert (red > yellow)
    # For priority: send critical immediately (skip warning to reduce spam)
    if first_red_date:
        # Alert — Red/Black (Critical) — highest priority
        recent = supabase_admin.table('alert_log') \
            .select('id') \
            .eq('machine_id', machine_id) \
            .eq('product_name', product_name) \
            .eq('alert_level', 'CRITICAL') \
            .gte('sent_at', cutoff) \
            .execute()

        if not recent.data:
            try:
                send_critical_alert(
                    to_email=alert_email,
                    vendor_name=vendor_name,
                    machine_name=machine_name,
                    machine_location=machine_location,
                    product_name=product_name,
                    current_stock=current_stock,
                    predicted_red_date=first_red_date,
                    is_priority=is_priority
                )
                supabase_admin.table('alert_log').insert({
                    'vendor_id': vendor_id,
                    'machine_id': machine_id,
                    'product_name': product_name,
                    'alert_level': 'CRITICAL',
                    'sent_at': now.isoformat(),
                    'predicted_date': first_red_date
                }).execute()
                alert_sent = True
            except Exception as e:
                print(f"[AlertEngine] Critical alert failed: {e}")

    elif first_yellow_date and not is_priority:
        # Alert — Yellow (Warning) — only for non-priority, only if no red alert
        alert_level = 'WARNING'
        recent = supabase_admin.table('alert_log') \
            .select('id') \
            .eq('machine_id', machine_id) \
            .eq('product_name', product_name) \
            .eq('alert_level', alert_level) \
            .gte('sent_at', cutoff) \
            .execute()

        if not recent.data:
            try:
                send_warning_alert(
                    to_email=alert_email,
                    vendor_name=vendor_name,
                    machine_name=machine_name,
                    machine_location=machine_location,
                    product_name=product_name,
                    current_stock=current_stock,
                    predicted_yellow_date=first_yellow_date
                )
                supabase_admin.table('alert_log').insert({
                    'vendor_id': vendor_id,
                    'machine_id': machine_id,
                    'product_name': product_name,
                    'alert_level': alert_level,
                    'sent_at': now.isoformat(),
                    'predicted_date': first_yellow_date
                }).execute()
                alert_sent = True
            except Exception as e:
                print(f"[AlertEngine] Warning alert failed: {e}")

    if alert_sent:
        _upload_alert_counter[machine_id] = current_count + 1
