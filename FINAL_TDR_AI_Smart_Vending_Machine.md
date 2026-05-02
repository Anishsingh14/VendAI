# Technical Design Report (TDR)
# AI Smart Vending Machine — Inventory Prediction & Alert System
## FINAL VERSION — Ready for Development

**Document Version:** 2.0 (Final)
**Author:** Anish Singh
**Date:** May 2, 2026
**Status:** Approved for Development

---

## 1. System Overview

The AI Smart Vending Machine is a college project developed by Anish Singh for the vending machine installed on his college campus. The machine stocks a unique range of products including sanitary products (sanitary pads, tampons), basic medications (paracetamol, antacids), and everyday consumables (chocolates, water bottles, chips, biscuits, soft drinks).

The backend is a Python Flask application that processes vendor-uploaded CSV inventory data, engineers time-series features, trains a per-product Random Forest model, predicts stockout dates, and dispatches Gmail SMTP email alerts. The frontend is built using Google Stitch. Data persistence and file storage are handled by Supabase (PostgreSQL + Storage Buckets). The full stack costs ₹0.

**Priority Product Logic:** Sanitary products and medications are tagged as `is_priority = TRUE` in the products table. When these products hit the Yellow (50%) threshold, the alert engine skips WARNING and fires a CRITICAL alert directly — because these items have immediate student welfare implications if they run out.

---

## 2. Full Architecture

```
[Google Stitch UI]
        |
        | HTTP REST calls
        v
[Flask Backend — PythonAnywhere]
        |
        |--- [Data Ingestion Module] <--- CSV/XLSX upload
        |--- [Column Mapper & Validator]
        |--- [Auto-Repair Pipeline]
        |--- [Feature Engineering Module]
        |--- [Random Forest Model Trainer]
        |--- [Prediction & Calendar Engine]
        |--- [Alert Decision Engine]
        |--- [Gmail SMTP Email Sender]
        |
        v
[Supabase]
   |--- PostgreSQL DB (all tables)
   |--- Storage Bucket (uploaded CSV files)
   |--- Auth (vendor login/signup/reset)
   |--- Row Level Security (data isolation per vendor)

[PythonAnywhere Task Scheduler]
   |--- Nightly job at 23:00 → runs prediction cycle for all vendors
```

---

## 3. Technology Stack

| Layer | Tool | Version | Cost |
|-------|------|---------|------|
| UI | Google Stitch | Latest | Free |
| Backend | Python + Flask | 3.10+ / 3.x | Free |
| ML | scikit-learn RandomForestRegressor | 1.4+ | Free |
| Data | pandas, numpy | 2.x / 1.x | Free |
| Model Save | joblib | 1.3+ | Free |
| Excel parsing | openpyxl | 3.x | Free |
| DB + Auth + Storage | Supabase | Free tier | Free |
| Supabase Python SDK | supabase-py | 2.x | Free |
| Email | smtplib (Python stdlib) | Built-in | Free |
| Scheduling | PythonAnywhere Task Scheduler | Built-in | Free |
| Hosting | PythonAnywhere | Free tier | Free |
| Version Control | GitHub | Free tier | Free |

---

## 4. Project Folder Structure

```
ai-smart-vending/
├── app.py                        # Flask entry point, route registration
├── requirements.txt              # All pip dependencies
├── .env                          # Supabase keys, Gmail credentials
├── config.py                     # Loads .env, defines constants
│
├── modules/
│   ├── ingest.py                 # CSV/XLSX loading, column mapper, upsert
│   ├── repair.py                 # Auto-repair pipeline, data health report
│   ├── features.py               # Feature engineering for RF model
│   ├── train.py                  # Random Forest training, evaluation, save model
│   ├── predict.py                # Stockout prediction, calendar data generation
│   ├── cold_start.py             # Fallback logic: manual form → moving average
│   ├── alert.py                  # Alert decision engine, threshold logic
│   ├── email_sender.py           # Gmail SMTP, HTML email composition
│   ├── insights.py               # Top/bottom sellers, seasonal pattern detection
│   └── scheduler.py              # Nightly batch prediction runner
│
├── models/
│   └── {machine_id}_{product}.pkl  # Saved RF models per product per machine
│
├── database/
│   └── supabase_client.py        # Supabase connection + query helpers
│
├── templates/
│   ├── email_warning.html        # Yellow alert email template
│   ├── email_critical.html       # Red/Black alert email template
│   ├── email_urgent.html         # Zero stock alert template
│   └── email_test.html           # Test alert email template
│
└── tests/
    ├── test_ingest.py
    ├── test_repair.py
    ├── test_features.py
    ├── test_predict.py
    ├── test_alert.py
    └── sample_data/              # The 4 sample CSVs for testing
```

---

## 5. Supabase Database Schema

### Table: `vendors`
```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    email TEXT UNIQUE NOT NULL,
    alert_email TEXT,              -- Active verified alert email
    alert_email_pending TEXT,      -- New email awaiting verification
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `machines`
```sql
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `products`
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    name TEXT NOT NULL,
    category TEXT,                 -- 'sanitary', 'medication', 'beverage', 'snack', 'other'
    is_priority BOOLEAN DEFAULT FALSE, -- TRUE for sanitary items and medications
    status TEXT DEFAULT 'active',  -- 'active', 'inactive', 'cold_start'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(machine_id, name)
);
```

> **Priority Products:** When `is_priority = TRUE`, the alert engine bypasses WARNING and fires CRITICAL directly at the Yellow threshold. The vendor can tag products as priority during setup or via the product list editor.

### Table: `inventory_logs`
```sql
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    vendor_id UUID REFERENCES vendors(id),
    product_name TEXT NOT NULL,
    log_date DATE NOT NULL,
    stock_added INTEGER DEFAULT 0,
    units_consumed INTEGER,
    stock_remaining INTEGER NOT NULL,
    day_of_week TEXT,
    month TEXT,
    notes TEXT,
    UNIQUE(machine_id, product_name, log_date)  -- Prevents duplicates on re-upload
);
```

### Table: `predictions`
```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    vendor_id UUID REFERENCES vendors(id),
    product_name TEXT NOT NULL,
    predicted_stockout_date DATE,
    days_until_stockout INTEGER,
    confidence_level TEXT,         -- 'HIGH', 'MEDIUM', 'LOW', 'COLD_START'
    current_stock INTEGER,
    predicted_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `alert_history`
```sql
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    vendor_id UUID REFERENCES vendors(id),
    product_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,      -- 'WARNING', 'CRITICAL', 'URGENT', 'TEST'
    predicted_stockout_date DATE,
    days_until_stockout INTEGER,
    current_stock INTEGER,
    alerted_at TIMESTAMP DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE
);
```

### Table: `product_change_log`
```sql
CREATE TABLE product_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    vendor_id UUID REFERENCES vendors(id),
    product_name TEXT NOT NULL,
    action TEXT NOT NULL,          -- 'ADDED', 'DEACTIVATED', 'RESTORED'
    changed_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `model_metadata`
```sql
CREATE TABLE model_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    vendor_id UUID REFERENCES vendors(id),
    product_name TEXT NOT NULL,
    model_path TEXT,
    r2_score REAL,
    mae_score REAL,
    confidence_level TEXT,
    data_rows_used INTEGER,
    trained_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Example policy: vendors see only their own data
CREATE POLICY vendor_isolation ON machines
    FOR ALL USING (vendor_id = auth.uid());
-- (Repeat for all tables)
```

---

## 6. Data Pipeline — All 5 Stages

### Stage 1: Ingest & Validate (`modules/ingest.py`)

```python
import pandas as pd
from supabase_client import supabase

REQUIRED_COLS = ['date', 'product_name', 'stock_added',
                 'units_consumed', 'stock_remaining']

def load_file(filepath: str) -> pd.DataFrame:
    if filepath.endswith('.xlsx'):
        return pd.read_excel(filepath, engine='openpyxl')
    return pd.read_csv(filepath)

def map_columns(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
    # mapping from Column Mapper UI: {'Your Col' -> 'our_field'}
    return df.rename(columns=mapping)

def validate(df: pd.DataFrame) -> dict:
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    return {"valid": len(missing) == 0, "missing_cols": missing}

def upsert_logs(df: pd.DataFrame, machine_id: str, vendor_id: str):
    df['machine_id'] = machine_id
    df['vendor_id'] = vendor_id
    records = df.to_dict(orient='records')
    # Supabase upsert — conflict on (machine_id, product_name, log_date)
    supabase.table('inventory_logs').upsert(
        records, on_conflict='machine_id,product_name,log_date'
    ).execute()
```

### Stage 2: Auto-Repair (`modules/repair.py`)

```python
def repair(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    report = {"rows_loaded": len(df), "fixed": [], "errors": []}

    # Parse dates
    df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
    bad_dates = df['date'].isna().sum()
    if bad_dates:
        report["fixed"].append(f"{bad_dates} unparseable dates dropped")
    df = df.dropna(subset=['date'])

    # Sort
    df = df.sort_values(['product_name', 'date']).reset_index(drop=True)

    # Derive units_consumed if missing
    if 'units_consumed' not in df.columns or df['units_consumed'].isna().all():
        df['units_consumed'] = (
            df.groupby('product_name')['stock_remaining'].shift(1)
            + df['stock_added'] - df['stock_remaining']
        ).clip(lower=0)
        report["fixed"].append("units_consumed derived from stock changes")

    # Default stock_added to 0
    df['stock_added'] = df['stock_added'].fillna(0)

    # Forward-fill gaps in stock_remaining
    df['stock_remaining'] = df.groupby('product_name')['stock_remaining'].ffill()

    # Flag negatives
    neg_rows = (df['stock_remaining'] < 0).sum()
    if neg_rows:
        report["errors"].append(f"{neg_rows} rows have negative stock_remaining — please review")

    # Remove duplicates
    df = df.drop_duplicates(subset=['product_name', 'date'], keep='last')

    # Auto-derive day_of_week and month
    df['day_of_week'] = df['date'].dt.day_name()
    df['month'] = df['date'].dt.month_name()

    report["rows_after_clean"] = len(df)
    return df, report
```

### Stage 3: Feature Engineering (`modules/features.py`)

```python
FEATURE_COLS = [
    'day_of_week_num', 'month_num', 'week_of_year', 'is_weekend',
    'rolling_7d_avg', 'rolling_7d_std', 'lag_1', 'lag_7',
    'days_since_restock'
]
TARGET_COL = 'units_consumed'

def engineer(df: pd.DataFrame, product: str) -> pd.DataFrame:
    pf = df[df['product_name'] == product].copy()
    pf = pf.sort_values('date').reset_index(drop=True)

    pf['day_of_week_num'] = pf['date'].dt.dayofweek
    pf['month_num'] = pf['date'].dt.month
    pf['week_of_year'] = pf['date'].dt.isocalendar().week.astype(int)
    pf['is_weekend'] = (pf['day_of_week_num'] >= 5).astype(int)
    pf['rolling_7d_avg'] = pf['units_consumed'].rolling(7, min_periods=1).mean()
    pf['rolling_7d_std'] = pf['units_consumed'].rolling(7, min_periods=1).std().fillna(0)
    pf['lag_1'] = pf['units_consumed'].shift(1).fillna(0)
    pf['lag_7'] = pf['units_consumed'].shift(7).fillna(0)

    restock_mask = (pf['stock_added'] > 0).astype(int)
    pf['days_since_restock'] = pf.groupby(restock_mask.cumsum()).cumcount()

    return pf.dropna(subset=FEATURE_COLS + [TARGET_COL])
```

### Stage 4: Model Training (`modules/train.py`)

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib, os

RF_PARAMS = {
    "n_estimators": 200,
    "max_depth": 10,
    "min_samples_leaf": 3,
    "random_state": 42,
    "n_jobs": -1
}

def train(df_feat: pd.DataFrame, machine_id: str, product: str) -> dict:
    X = df_feat[FEATURE_COLS]
    y = df_feat[TARGET_COL]

    if len(X) < 14:
        return {"status": "cold_start", "message": "Insufficient data"}

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = RandomForestRegressor(**RF_PARAMS)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_val)
    mae = mean_absolute_error(y_val, y_pred)
    r2 = r2_score(y_val, y_pred)

    confidence = "HIGH" if r2 >= 0.75 else "MEDIUM" if r2 >= 0.50 else "LOW"

    os.makedirs("models", exist_ok=True)
    path = f"models/{machine_id}_{product.replace(' ', '_')}.pkl"
    joblib.dump(model, path)

    return {
        "status": "trained",
        "model_path": path,
        "r2": round(r2, 3),
        "mae": round(mae, 2),
        "confidence": confidence,
        "rows_used": len(X)
    }
```

### Stage 5: Prediction & Calendar (`modules/predict.py`)

```python
from datetime import date, timedelta
import numpy as np

def get_calendar_data(model, current_stock: int, capacity: int,
                      last_row: dict) -> list:
    """
    Returns list of {date, predicted_stock, color, confidence_level}
    for the next 30 days.
    """
    stock = current_stock
    today = date.today()
    calendar = []
    row = last_row.copy()

    for days_ahead in range(1, 31):
        future_date = today + timedelta(days=days_ahead)
        row['day_of_week_num'] = future_date.weekday()
        row['month_num'] = future_date.month
        row['week_of_year'] = future_date.isocalendar()[1]
        row['is_weekend'] = int(future_date.weekday() >= 5)
        row['days_since_restock'] += 1

        features = np.array([[row[f] for f in FEATURE_COLS]])
        predicted_consumption = max(0, round(model.predict(features)[0]))
        stock = max(0, stock - predicted_consumption)

        pct_remaining = stock / capacity if capacity > 0 else 0

        # Color logic
        if pct_remaining > 0.50:
            color = "green"
        elif pct_remaining > 0.20:
            color = "yellow"
        elif pct_remaining > 0:
            color = "red"
        else:
            color = "black"

        # Confidence level
        if days_ahead <= 14:
            confidence = "HIGH"
        elif days_ahead <= 30:
            confidence = "MEDIUM"
        else:
            confidence = "NONE"

        # Update rolling avg for next day
        row['lag_1'] = predicted_consumption
        row['rolling_7d_avg'] = (row['rolling_7d_avg'] * 6 + predicted_consumption) / 7

        calendar.append({
            "date": str(future_date),
            "predicted_stock": stock,
            "pct_remaining": round(pct_remaining * 100, 1),
            "color": color,
            "confidence": confidence
        })

    return calendar

def get_stockout_date(calendar: list) -> dict:
    first_yellow = next((d for d in calendar if d['color'] == 'yellow'), None)
    first_red = next((d for d in calendar if d['color'] in ['red', 'black']), None)
    return {
        "first_yellow_date": first_yellow['date'] if first_yellow else None,
        "first_critical_date": first_red['date'] if first_red else None
    }
```

---

## 7. Cold Start Logic (`modules/cold_start.py`)

```python
def cold_start_prediction(current_stock: int, estimated_daily_sales: float,
                          capacity: int) -> list:
    """Fallback when < 14 days data. Uses simple daily depletion."""
    stock = current_stock
    today = date.today()
    calendar = []

    for days_ahead in range(1, 31):
        future_date = today + timedelta(days=days_ahead)
        stock = max(0, stock - estimated_daily_sales)
        pct = stock / capacity if capacity > 0 else 0

        color = "green" if pct > 0.50 else "yellow" if pct > 0.20 else "red" if pct > 0 else "black"

        calendar.append({
            "date": str(future_date),
            "predicted_stock": round(stock),
            "pct_remaining": round(pct * 100, 1),
            "color": color,
            "confidence": "LOW"
        })

    return calendar
```

---

## 8. Alert Engine (`modules/alert.py`)

```python
from datetime import datetime, timedelta

ALERT_COOLDOWN_HOURS = 24

def should_send_alert(machine_id: str, product_name: str,
                      alert_type: str, supabase) -> bool:
    cutoff = datetime.now() - timedelta(hours=ALERT_COOLDOWN_HOURS)
    result = supabase.table('alert_history').select('alerted_at').eq(
        'machine_id', machine_id
    ).eq('product_name', product_name).eq(
        'alert_type', alert_type
    ).gte('alerted_at', cutoff.isoformat()).execute()
    return len(result.data) == 0

def process_alerts(vendor_id: str, machine_id: str, product_name: str,
                   calendar: list, current_stock: int,
                   vendor_email: str, machine_location: str, supabase):

    # Immediate: zero stock
    if current_stock == 0:
        if should_send_alert(machine_id, product_name, 'URGENT', supabase):
            send_alert_email(vendor_email, {...}, 'URGENT')
            log_alert(supabase, machine_id, vendor_id, product_name, 'URGENT', ...)
        return

    dates = get_stockout_date(calendar)

    # Check if this is a priority product (sanitary/medication)
    product_data = supabase.table('products').select('is_priority').eq(
        'machine_id', machine_id
    ).eq('name', product_name).execute().data
    is_priority = product_data[0]['is_priority'] if product_data else False

    # Warning: first yellow
    # Priority products skip WARNING and go straight to CRITICAL at yellow threshold
    if dates['first_yellow_date']:
        alert_level = 'CRITICAL' if is_priority else 'WARNING'
        if should_send_alert(machine_id, product_name, alert_level, supabase):
            send_alert_email(vendor_email, {...}, alert_level)
            log_alert(supabase, machine_id, vendor_id, product_name, alert_level, ...)

    # Critical: first red/black (all products)
    if dates['first_critical_date'] and not is_priority:
        if should_send_alert(machine_id, product_name, 'CRITICAL', supabase):
            send_alert_email(vendor_email, {...}, 'CRITICAL')
            log_alert(supabase, machine_id, vendor_id, product_name, 'CRITICAL', ...)
```

---

## 9. Email Sender (`modules/email_sender.py`)

```python
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER = os.getenv("GMAIL_USER")
SMTP_PASS = os.getenv("GMAIL_APP_PASSWORD")  # Google App Password (not login password)

ALERT_COLORS = {
    "WARNING": "#d97706",
    "CRITICAL": "#dc2626",
    "URGENT": "#7c3aed",
    "TEST": "#2563eb"
}

def send_alert_email(to_email: str, data: dict, alert_type: str):
    msg = MIMEMultipart('alternative')
    color = ALERT_COLORS.get(alert_type, "#333")

    if alert_type == "TEST":
        subject = "[TEST] Alert System Working — AI Smart Vending"
    else:
        subject = f"[{alert_type}] Stock Alert — {data['product']} at {data['location']}"

    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = to_email

    html = f"""
    <html><body style="font-family:Arial,sans-serif;padding:24px;max-width:600px">
      <div style="border-left:4px solid {color};padding-left:16px">
        <h2 style="color:{color};margin:0">{alert_type} ALERT</h2>
        <p style="color:#666;margin:4px 0">AI Smart Vending Machine System</p>
      </div>
      <table style="width:100%;margin-top:20px;border-collapse:collapse">
        <tr><td style="padding:8px;color:#666">Machine</td><td style="padding:8px"><b>{data.get('machine_name','—')}</b></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Location</td><td style="padding:8px">{data.get('location','—')}</td></tr>
        <tr><td style="padding:8px;color:#666">Product</td><td style="padding:8px"><b>{data.get('product','—')}</b></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Current Stock</td><td style="padding:8px">{data.get('current_stock','—')} units</td></tr>
        <tr><td style="padding:8px;color:#666">Predicted Stockout</td><td style="padding:8px"><b style="color:{color}">{data.get('stockout_date','—')}</b></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Status Level</td><td style="padding:8px">{data.get('status_color','—').upper()}</td></tr>
      </table>
      <p style="margin-top:24px;color:#999;font-size:12px">
        This alert was sent by your AI Smart Vending system. Log in to your dashboard to view the full calendar.
      </p>
    </body></html>
    """

    msg.attach(MIMEText(html, 'html'))
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
```

---

## 10. Insights Engine (`modules/insights.py`)

```python
SEASON_MAP = {
    1: "winter", 2: "winter",
    3: "summer", 4: "summer", 5: "summer",
    6: "monsoon", 7: "monsoon", 8: "monsoon", 9: "monsoon",
    10: "festive", 11: "festive", 12: "festive"
}

def get_insights(df: pd.DataFrame, machine_id: str) -> dict:
    mdf = df[df['machine_id'] == machine_id].copy()

    # Top and bottom sellers
    product_totals = mdf.groupby('product_name')['units_consumed'].sum().sort_values(ascending=False)
    top_sellers = product_totals.head(3).to_dict()
    bottom_sellers = product_totals.tail(3).to_dict()

    # Seasonal patterns
    mdf['month_num'] = pd.to_datetime(mdf['date']).dt.month
    mdf['season'] = mdf['month_num'].map(SEASON_MAP)
    seasonal_avg = mdf.groupby(['product_name', 'season'])['units_consumed'].mean()
    overall_avg = mdf.groupby('product_name')['units_consumed'].mean()

    seasonal_insights = []
    for product in mdf['product_name'].unique():
        for season in ['summer', 'monsoon', 'winter', 'festive']:
            try:
                s_avg = seasonal_avg[product][season]
                o_avg = overall_avg[product]
                pct_diff = ((s_avg - o_avg) / o_avg) * 100
                if abs(pct_diff) >= 20:
                    direction = "more" if pct_diff > 0 else "less"
                    seasonal_insights.append(
                        f"{product} sells {abs(round(pct_diff))}% {direction} in {season}"
                    )
            except KeyError:
                pass

    return {
        "top_sellers": top_sellers,
        "bottom_sellers": bottom_sellers,
        "seasonal_insights": seasonal_insights[:5]
    }
```

---

## 11. Scheduler (`modules/scheduler.py`)

```python
# This file is registered as a nightly PythonAnywhere scheduled task
# Run: python scheduler.py at 23:00 every day

from supabase_client import supabase
from modules.predict import get_calendar_data, get_stockout_date
from modules.alert import process_alerts
import joblib, os

def run_nightly_predictions():
    vendors = supabase.table('vendors').select('*').execute().data
    for vendor in vendors:
        machines = supabase.table('machines').select('*').eq(
            'vendor_id', vendor['id']
        ).execute().data
        for machine in machines:
            products = supabase.table('products').select('*').eq(
                'machine_id', machine['id']
            ).eq('status', 'active').execute().data
            for product in products:
                model_path = f"models/{machine['id']}_{product['name'].replace(' ', '_')}.pkl"
                if not os.path.exists(model_path):
                    continue
                model = joblib.load(model_path)
                # Fetch latest row from inventory_logs for this product
                latest = supabase.table('inventory_logs').select('*').eq(
                    'machine_id', machine['id']
                ).eq('product_name', product['name']).order(
                    'log_date', desc=True
                ).limit(1).execute().data
                if not latest:
                    continue
                last_row = latest[0]
                current_stock = last_row['stock_remaining']
                calendar = get_calendar_data(model, current_stock, 100, last_row)
                process_alerts(
                    vendor['id'], machine['id'], product['name'],
                    calendar, current_stock,
                    vendor['alert_email'], machine['location'], supabase
                )

if __name__ == "__main__":
    run_nightly_predictions()
```

---

## 12. REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new vendor | No |
| POST | `/api/auth/login` | Login, returns session token | No |
| POST | `/api/auth/forgot-password` | Send reset link to email | No |
| GET | `/api/profile` | Get vendor name + alert email | Yes |
| PUT | `/api/profile/email` | Update alert email (sends verification) | Yes |
| POST | `/api/profile/test-alert` | Send test alert to current email | Yes |
| GET | `/api/machines` | List all machines for vendor | Yes |
| POST | `/api/machines` | Add new machine | Yes |
| POST | `/api/machines/{id}/upload` | Upload CSV for machine | Yes |
| GET | `/api/machines/{id}/products` | List products + stock status | Yes |
| POST | `/api/machines/{id}/products` | Add new product manually | Yes |
| PUT | `/api/products/{id}/status` | Set product active/inactive | Yes |
| GET | `/api/products/{id}/calendar` | Get 30-day calendar data | Yes |
| GET | `/api/machines/{id}/insights` | Get insights for machine | Yes |
| GET | `/api/alerts` | Get all active alerts for vendor | Yes |

---

## 13. Environment Variables (`.env`)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
GMAIL_USER=yourname@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
SECRET_KEY=random_flask_secret_key
ALERT_THRESHOLD_DAYS=3
MODEL_MIN_ROWS=14
STALE_DATA_WARN_DAYS=30
STALE_DATA_PAUSE_DAYS=45
```

---

## 14. requirements.txt

```
flask==3.0.0
pandas==2.1.0
numpy==1.26.0
scikit-learn==1.4.0
joblib==1.3.2
openpyxl==3.1.2
supabase==2.3.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

---

## 15. Known Edge Cases & Handling

| Edge Case | Handling |
|-----------|---------|
| stock_remaining = 0 on upload | Immediate URGENT alert, bypass prediction cycle |
| Fewer than 14 days data | cold_start.py fallback: simple daily depletion |
| Same CSV uploaded twice | Upsert with UNIQUE(machine_id, product_name, log_date) |
| Multi-machine CSV without machine_id col | Prompt vendor to select machine from dropdown |
| Vendor changes alert email | New email verified before becoming active; old email remains until verification |
| Product deleted then re-added | Restore from inactive state; all history preserved |
| Date format DD/MM vs MM/DD | pd.to_datetime with dayfirst=True + infer_datetime_format |
| No data for 30 days | Dashboard banner prompts re-upload |
| No data for 45 days | Alerts paused, vendor notified via last known email |
| Model older than 30 days | Flag for retraining in model_metadata; prompt vendor on dashboard |

---

## 16. Testing Plan

### Unit Tests
- `test_ingest.py` — column validation, missing columns, upsert logic
- `test_repair.py` — date parsing, derived fields, negative value flagging
- `test_features.py` — feature output for known input rows
- `test_predict.py` — calendar colors for known stock/consumption values
- `test_alert.py` — cooldown logic, zero stock trigger, dual threshold

### Integration Test
- Upload sample CSV (Machine_1_CityMall) → validate → repair → features → train → predict → calendar → alert check
- Upload same CSV twice → verify no duplicate rows in DB
- Test cold start flow with < 14 rows dataset

### Edge Case Tests
- CSV with only 5 rows (cold start path)
- CSV where all stock_remaining = 0 (all URGENT alerts)
- CSV with gaps of 5+ days between dates
- CSV with Hindi product names (Unicode handling)
- Multi-machine CSV with 4 machine IDs

---

## 17. Deployment Steps (PythonAnywhere)

1. Push code to GitHub repository
2. Log in to PythonAnywhere → "Consoles" → Bash
3. `git clone https://github.com/yourusername/ai-smart-vending.git`
4. `pip install -r requirements.txt --user`
5. Create `.env` file with all environment variables
6. Set up Web App: source = `app.py`, working dir = project root
7. Add Scheduled Task: `python /home/yourusername/ai-smart-vending/modules/scheduler.py` at 23:00 daily
8. Test upload → verify CSV processed, model trained, calendar returned
9. Test alert → click "Send Test Alert" on profile page, verify email received

