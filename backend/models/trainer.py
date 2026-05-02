"""
VendAI — Random Forest Model Trainer
Trains per-product-per-machine RF models and stores predictions in Supabase
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, date, timedelta, timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score
from supabase_client import supabase_admin

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../data/models')
os.makedirs(MODEL_DIR, exist_ok=True)

# Season mapping (India)
SEASON_MAP = {1: 'winter', 2: 'winter', 3: 'summer', 4: 'summer', 5: 'summer',
              6: 'monsoon', 7: 'monsoon', 8: 'monsoon', 9: 'monsoon',
              10: 'festive', 11: 'festive', 12: 'festive'}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add ML feature columns to the dataframe."""
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['season_code'] = df['month'].map({'winter': 0, 'summer': 1, 'monsoon': 2, 'festive': 3})
    df['season_code'] = df['month'].map(lambda m: {'winter': 0, 'summer': 1, 'monsoon': 2, 'festive': 3}[SEASON_MAP[m]])

    # Lag features
    df['rolling_7d_avg'] = df['units_consumed'].rolling(7, min_periods=1).mean()
    df['rolling_7d_std'] = df['units_consumed'].rolling(7, min_periods=1).std().fillna(0)
    df['lag_1'] = df['units_consumed'].shift(1).fillna(df['units_consumed'].mean())
    df['lag_7'] = df['units_consumed'].shift(7).fillna(df['units_consumed'].mean())

    # Days since last restock
    restock_dates = df[df['stock_added'] > 0]['date']
    def days_since_restock(row_date):
        past = restock_dates[restock_dates <= row_date]
        if past.empty:
            return 999
        return (row_date - past.max()).days
    df['days_since_restock'] = df['date'].apply(days_since_restock)

    return df


FEATURE_COLS = ['day_of_week', 'month', 'week_of_year', 'is_weekend', 'season_code',
                'rolling_7d_avg', 'rolling_7d_std', 'lag_1', 'lag_7', 'days_since_restock']


def train_models_for_machine(machine_id: str, vendor_id: str):
    """Train RF model for every active product in this machine."""
    # Fetch all inventory data for machine
    raw = supabase_admin.table('inventory_data') \
        .select('*') \
        .eq('machine_id', machine_id) \
        .order('date') \
        .execute()

    if not raw.data:
        print(f"[Trainer] No data found for machine {machine_id}")
        return

    df = pd.DataFrame(raw.data)
    products = df['product_name'].dropna().unique().tolist()

    for product_name in products:
        product_df = df[df['product_name'] == product_name].copy()

        if len(product_df) < 7:
            # Cold start: use moving average fallback
            _store_cold_start_prediction(machine_id, vendor_id, product_name, product_df)
            continue

        try:
            product_df = engineer_features(product_df)
            X = product_df[FEATURE_COLS]
            # Train on units_consumed (daily consumption), NOT stock_remaining
            y = product_df['units_consumed'].clip(lower=0)

            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_leaf=3,
                random_state=42
            )
            model.fit(X, y)

            # Cross-validation score
            if len(product_df) >= 14:
                scores = cross_val_score(model, X, y, cv=3, scoring='r2')
                confidence = max(0.0, float(np.mean(scores)))
            else:
                confidence = 0.5

            # Save model to disk
            model_key = f"{machine_id}_{product_name.replace(' ', '_')}.pkl"
            model_path = os.path.join(MODEL_DIR, model_key)
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)

            # Generate 30-day predictions
            predictions = _predict_30_days(model, product_df, product_name)

            # Store in Supabase
            _store_predictions(machine_id, vendor_id, product_name, predictions, confidence, product_df)

        except Exception as e:
            print(f"[Trainer] Error training model for {product_name}: {e}")
            _store_cold_start_prediction(machine_id, vendor_id, product_name, product_df)


def _predict_30_days(model: RandomForestRegressor, df: pd.DataFrame, product_name: str) -> list:
    """Generate day-by-day stock predictions for the next 30 days."""
    last_row = df.iloc[-1].copy()
    current_stock = float(last_row['stock_remaining'])
    max_capacity = float(df['stock_remaining'].max())
    if max_capacity == 0:
        max_capacity = 100

    predictions = []
    last_date = pd.to_datetime(last_row['date'])

    # Build a rolling feature window
    recent = df['units_consumed'].tail(7).values.tolist()

    for day_offset in range(1, 31):
        pred_date = last_date + timedelta(days=day_offset)
        avg_consumption = np.mean(recent[-7:])
        std_consumption = np.std(recent[-7:]) if len(recent) >= 2 else 0

        features = {
            'day_of_week': pred_date.dayofweek,
            'month': pred_date.month,
            'week_of_year': pred_date.isocalendar()[1],
            'is_weekend': int(pred_date.dayofweek >= 5),
            'season_code': {'winter': 0, 'summer': 1, 'monsoon': 2, 'festive': 3}[SEASON_MAP[pred_date.month]],
            'rolling_7d_avg': avg_consumption,
            'rolling_7d_std': std_consumption,
            'lag_1': recent[-1] if recent else avg_consumption,
            'lag_7': recent[-7] if len(recent) >= 7 else avg_consumption,
            'days_since_restock': day_offset
        }

        X_pred = pd.DataFrame([features])[FEATURE_COLS]
        predicted_consumption = max(0, float(model.predict(X_pred)[0]))
        current_stock = max(0, current_stock - predicted_consumption)

        pct_remaining = current_stock / max_capacity * 100
        if pct_remaining > 50:
            status = 'green'
        elif pct_remaining > 20:
            status = 'yellow'
        elif pct_remaining > 0:
            status = 'red'
        else:
            status = 'black'

        # Confidence degrades over time
        if day_offset <= 14:
            confidence_level = 'high'
        elif day_offset <= 30:
            confidence_level = 'medium'
        else:
            confidence_level = 'none'

        predictions.append({
            'date': pred_date.strftime('%Y-%m-%d'),
            'predicted_stock': round(current_stock, 2),
            'stock_status': status,
            'confidence_level': confidence_level,
            'pct_remaining': round(pct_remaining, 1)
        })

        recent.append(predicted_consumption)

    return predictions


def _store_predictions(machine_id, vendor_id, product_name, predictions, model_confidence, df):
    """Upsert predictions to Supabase and find first alert thresholds."""
    records = []
    first_yellow = None
    first_red_black = None

    for p in predictions:
        records.append({
            'machine_id': machine_id,
            'vendor_id': vendor_id,
            'product_name': product_name,
            'prediction_date': p['date'],
            'predicted_stock': p['predicted_stock'],
            'stock_status': p['stock_status'],
            'confidence_level': p['confidence_level'],
            'model_confidence_score': round(model_confidence, 3)
        })

        if first_yellow is None and p['stock_status'] == 'yellow':
            first_yellow = p['date']
        if first_red_black is None and p['stock_status'] in ('red', 'black'):
            first_red_black = p['date']

    # Upsert predictions in chunks
    for chunk in [records[i:i+100] for i in range(0, len(records), 100)]:
        supabase_admin.table('predictions').upsert(
            chunk, on_conflict='machine_id,product_name,prediction_date'
        ).execute()

    # Update product record with latest prediction summary
    product_res = supabase_admin.table('products') \
        .select('id, is_priority') \
        .eq('machine_id', machine_id) \
        .eq('product_name', product_name) \
        .single().execute()

    if product_res.data:
        supabase_admin.table('products').update({
            'first_yellow_date': first_yellow,
            'first_red_date': first_red_black,
            'model_confidence': round(model_confidence, 3),
            'data_confidence': 'strong' if model_confidence > 0.7 else ('building' if model_confidence > 0.4 else 'low')
        }).eq('id', product_res.data['id']).execute()

        # Trigger email alerts if thresholds found
        if first_yellow or first_red_black:
            from utils.alert_engine import check_and_fire_alerts
            check_and_fire_alerts(
                machine_id=machine_id,
                vendor_id=vendor_id,
                product_name=product_name,
                is_priority=product_res.data.get('is_priority', False),
                first_yellow_date=first_yellow,
                first_red_date=first_red_black
            )


def _store_cold_start_prediction(machine_id, vendor_id, product_name, df):
    """Moving average fallback when < 14 days of data."""
    if df.empty:
        return

    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    current_stock = float(df['stock_remaining'].iloc[-1])
    max_capacity = float(df['stock_remaining'].max()) or 100
    avg_daily = df['units_consumed'].mean() if 'units_consumed' in df.columns else 1.0
    if avg_daily <= 0:
        avg_daily = 1.0

    last_date = df['date'].iloc[-1]
    records = []

    for day_offset in range(1, 31):
        pred_date = last_date + timedelta(days=day_offset)
        current_stock = max(0, current_stock - avg_daily)
        pct = current_stock / max_capacity * 100

        if pct > 50:
            status = 'green'
        elif pct > 20:
            status = 'yellow'
        elif pct > 0:
            status = 'red'
        else:
            status = 'black'

        records.append({
            'machine_id': machine_id,
            'vendor_id': vendor_id,
            'product_name': product_name,
            'prediction_date': pred_date.strftime('%Y-%m-%d'),
            'predicted_stock': round(current_stock, 2),
            'stock_status': status,
            'confidence_level': 'low',
            'model_confidence_score': 0.3
        })

    for chunk in [records[i:i+100] for i in range(0, len(records), 100)]:
        supabase_admin.table('predictions').upsert(
            chunk, on_conflict='machine_id,product_name,prediction_date'
        ).execute()

    # Also update the products table with cold start confidence
    try:
        product_res = supabase_admin.table('products') \
            .select('id') \
            .eq('machine_id', machine_id) \
            .eq('product_name', product_name) \
            .single().execute()

        if product_res.data:
            # Find first yellow/red dates for alert triggering
            first_yellow = None
            first_red = None
            for r in records:
                if first_yellow is None and r['stock_status'] == 'yellow':
                    first_yellow = r['prediction_date']
                if first_red is None and r['stock_status'] in ('red', 'black'):
                    first_red = r['prediction_date']

            supabase_admin.table('products').update({
                'model_confidence': 0.3,
                'data_confidence': 'low',
                'first_yellow_date': first_yellow,
                'first_red_date': first_red
            }).eq('id', product_res.data['id']).execute()
    except Exception:
        pass
