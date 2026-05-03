"""
VendAI — Predictor
Fetches stored predictions from Supabase for calendar view display
"""
import calendar
from datetime import date, timedelta, datetime, timezone
from supabase_client import supabase_admin

def get_product_calendar(machine_id: str, product_name: str, vendor_id: str) -> dict:
    """
    Returns a full calendar view for the current month with stock status per day.
    Also returns confidence badge info per day range.
    """
    # Use IST offset to correctly determine "today" for India timezone (+05:30)
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    today = datetime.now(ist_tz).date()
    year = today.year
    month = today.month
    _, days_in_month = calendar.monthrange(year, month)

    month_start = date(year, month, 1)
    month_end = date(year, month, days_in_month)

    # Fetch product info first
    product_res = supabase_admin.table('products') \
        .select('stock_remaining, is_priority, data_confidence, model_confidence') \
        .eq('machine_id', machine_id) \
        .eq('product_name', product_name) \
        .single().execute()

    product_meta = product_res.data or {}

    # Fetch predictions for this month
    res = supabase_admin.table('predictions') \
        .select('*') \
        .eq('machine_id', machine_id) \
        .eq('product_name', product_name) \
        .gte('prediction_date', month_start.isoformat()) \
        .lte('prediction_date', month_end.isoformat()) \
        .order('prediction_date') \
        .execute()

    predictions_by_date = {}
    for p in (res.data or []):
        predictions_by_date[p['prediction_date']] = p

    # Build calendar days
    calendar_days = []
    for day in range(1, days_in_month + 1):
        d = date(year, month, day)
        d_str = d.isoformat()
        pred = predictions_by_date.get(d_str)

        if pred:
            status = pred['stock_status']
            confidence = pred['confidence_level']
            stock_pct = pred.get('pct_remaining', None)
        elif d < today:
            status = 'historical'
            confidence = 'actual'
            stock_pct = None
        elif d == today:
            # Use real-time current stock for today
            current_stock = float(product_meta.get('stock_remaining', 0))
            max_capacity = 100.0 # Default max capacity since we don't store it explicitly per product
            pct = current_stock / max_capacity * 100
            if pct > 50:
                status = 'green'
            elif pct > 20:
                status = 'yellow'
            elif pct > 0:
                status = 'red'
            else:
                status = 'black'
            confidence = 'actual'
            stock_pct = pct
        else:
            status = 'unknown'
            confidence = 'none'
            stock_pct = None

        # Override confidence for day ranges
        days_from_today = (d - today).days
        if days_from_today < 0:
            confidence_badge = None
        elif days_from_today < 14:
            confidence_badge = 'high'
        elif days_from_today < 30:
            confidence_badge = 'medium'
        else:
            confidence_badge = 'none'

        calendar_days.append({
            'date': d_str,
            'day': day,
            'is_today': d == today,
            'is_past': d < today,
            'status': status,
            'confidence_badge': confidence_badge,
            'stock_pct': stock_pct
        })

    # Summary stats
    statuses = [d['status'] for d in calendar_days if not d['is_past']]
    first_yellow = next((d['date'] for d in calendar_days if d['status'] == 'yellow' and not d['is_past']), None)
    first_red = next((d['date'] for d in calendar_days if d['status'] in ('red', 'black') and not d['is_past']), None)

    return {
        'machine_id': machine_id,
        'product_name': product_name,
        'month': month,
        'year': year,
        'calendar_days': calendar_days,
        'first_yellow_date': first_yellow,
        'first_red_date': first_red,
        'is_priority': product_meta.get('is_priority', False),
        'data_confidence': product_meta.get('data_confidence', 'low'),
        'model_confidence_score': product_meta.get('model_confidence', 0)
    }
