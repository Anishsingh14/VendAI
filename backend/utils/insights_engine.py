"""
VendAI — Insights Engine
Computes top/bottom sellers and seasonal patterns per machine
"""

import pandas as pd
from supabase_client import supabase_admin

SEASON_MAP = {
    1: 'Winter', 2: 'Winter', 3: 'Summer', 4: 'Summer', 5: 'Summer',
    6: 'Monsoon', 7: 'Monsoon', 8: 'Monsoon', 9: 'Monsoon',
    10: 'Festive', 11: 'Festive', 12: 'Festive'
}


def compute_insights(machine_id: str, vendor_id: str) -> dict:
    """Compute insights from the last 90 days of inventory data."""
    raw = supabase_admin.table('inventory_data') \
        .select('product_name, units_consumed, date') \
        .eq('machine_id', machine_id) \
        .order('date', desc=True) \
        .limit(5000) \
        .execute()

    if not raw.data:
        return {'error': 'No data available. Upload inventory data to see insights.'}

    df = pd.DataFrame(raw.data)
    df['date'] = pd.to_datetime(df['date'])
    df['units_consumed'] = pd.to_numeric(df['units_consumed'], errors='coerce').fillna(0)
    df['month'] = df['date'].dt.month
    df['week'] = df['date'].dt.isocalendar().week.astype(int)

    # Last 90 days only
    cutoff = df['date'].max() - pd.Timedelta(days=90)
    df = df[df['date'] >= cutoff]

    # Weekly average per product
    weekly = df.groupby('product_name')['units_consumed'].sum() / max(df['date'].nunique() / 7, 1)
    weekly = weekly.sort_values(ascending=False)

    top_sellers = [
        {'rank': i+1, 'product': p, 'units_per_week': round(v, 1)}
        for i, (p, v) in enumerate(weekly.head(3).items())
    ]
    bottom_sellers = [
        {'rank': i+1, 'product': p, 'units_per_week': round(v, 1)}
        for i, (p, v) in enumerate(weekly.tail(3).items())
    ]

    # Seasonal patterns
    seasonal_insights = []
    all_data = supabase_admin.table('inventory_data') \
        .select('product_name, units_consumed, date') \
        .eq('machine_id', machine_id) \
        .execute()
    full_df = pd.DataFrame(all_data.data) if all_data.data else df

    if not full_df.empty:
        full_df['date'] = pd.to_datetime(full_df['date'])
        full_df['units_consumed'] = pd.to_numeric(full_df['units_consumed'], errors='coerce').fillna(0)
        full_df['month'] = full_df['date'].dt.month
        full_df['season'] = full_df['month'].map(SEASON_MAP)

        season_agg = full_df.groupby(['product_name', 'season'])['units_consumed'].mean()
        overall_agg = full_df.groupby('product_name')['units_consumed'].mean()

        for product in overall_agg.index:
            for season in ['Summer', 'Monsoon', 'Winter', 'Festive']:
                try:
                    season_avg = season_agg.loc[product, season]
                    overall_avg = overall_agg.loc[product]
                    if overall_avg > 0:
                        pct_change = (season_avg - overall_avg) / overall_avg * 100
                        if abs(pct_change) >= 20:
                            direction = 'MORE' if pct_change > 0 else 'LESS'
                            seasonal_insights.append({
                                'product': product,
                                'season': season,
                                'direction': direction,
                                'pct_change': round(abs(pct_change), 0),
                                'insight': f"{product} sells {round(abs(pct_change))}% {direction} in {season}"
                            })
                except KeyError:
                    pass

    # Deduplicate & take top 5 by pct_change
    seasonal_insights = sorted(seasonal_insights, key=lambda x: x['pct_change'], reverse=True)[:5]

    return {
        'machine_id': machine_id,
        'days_analyzed': (df['date'].max() - df['date'].min()).days if not df.empty else 0,
        'top_sellers': top_sellers,
        'bottom_sellers': bottom_sellers,
        'seasonal_insights': seasonal_insights,
        'updated_at': df['date'].max().isoformat() if not df.empty else None
    }
