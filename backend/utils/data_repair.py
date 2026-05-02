"""
VendAI — Data Repair & Column Detection Utilities
"""

import pandas as pd
import numpy as np
from datetime import datetime


COLUMN_ALIASES = {
    'date': ['date', 'day', 'Date', 'DATE', 'transaction_date', 'sale_date'],
    'product_name': ['product_name', 'product', 'item', 'item_name', 'Product', 'name'],
    'stock_remaining': ['stock_remaining', 'remaining', 'remaining_stock', 'end_stock', 'closing_stock', 'stock'],
    'units_consumed': ['units_consumed', 'sold', 'consumed', 'units_sold', 'sales', 'qty_sold'],
    'stock_added': ['stock_added', 'restock', 'added', 'replenished', 'restock_qty', 'stock_in'],
    'machine_id': ['machine_id', 'machine', 'vending_machine', 'machine_name', 'MachineID'],
    'location': ['location', 'loc', 'place', 'site'],
    'notes': ['notes', 'note', 'remarks', 'comment']
}


def detect_columns(file_columns: list) -> dict:
    """Auto-detect column mapping from CSV column names."""
    mapping = {}
    for required_field, aliases in COLUMN_ALIASES.items():
        for col in file_columns:
            if col.strip().lower() in [a.lower() for a in aliases]:
                mapping[required_field] = col
                break
    return mapping


def repair_dataframe(df: pd.DataFrame, machine_id: str) -> tuple:
    """
    Repair and standardize the dataframe.
    Returns (repaired_df, health_report)
    """
    report = {
        'rows_input': len(df),
        'issues_fixed': [],
        'issues_flagged': [],
        'rows_output': 0
    }

    # ── Date parsing ──
    if 'date' in df.columns:
        try:
            df['date'] = pd.to_datetime(df['date'], dayfirst=False, errors='coerce')
            df = df.dropna(subset=['date'])  # Drop rows where date couldn't be parsed
            df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        except Exception:
            report['issues_flagged'].append('Could not parse date column — please use YYYY-MM-DD format')

    else:
        report['issues_flagged'].append('No date column found')
        return df, report

    # ── Sort by date ──
    df = df.sort_values('date').reset_index(drop=True)

    # ── Derive missing columns ──
    if 'units_consumed' not in df.columns and all(c in df.columns for c in ['stock_remaining', 'stock_added']):
        df['units_consumed'] = (
            df['stock_remaining'].shift(1) + df['stock_added'] - df['stock_remaining']
        ).clip(lower=0)
        df['units_consumed'] = df['units_consumed'].fillna(0)
        report['issues_fixed'].append('Derived units_consumed from stock_remaining + stock_added')

    if 'stock_added' not in df.columns:
        df['stock_added'] = 0
        report['issues_fixed'].append('Missing stock_added — set to 0')

    # ── Forward-fill date gaps (per product) ──
    if 'product_name' in df.columns:
        products = df['product_name'].dropna().unique()
        filled_dfs = []
        for product in products:
            pdf = df[df['product_name'] == product].copy()
            date_range = pd.date_range(pdf['date'].min(), pdf['date'].max(), freq='D')
            pdf = pdf.set_index('date').reindex([d.strftime('%Y-%m-%d') for d in date_range])
            pdf['product_name'] = product
            pdf = pdf.ffill()
            pdf['stock_added'] = pdf['stock_added'].fillna(0)
            pdf = pdf.reset_index().rename(columns={'index': 'date'})
            filled_dfs.append(pdf)

        if filled_dfs:
            df = pd.concat(filled_dfs, ignore_index=True)
            report['issues_fixed'].append('Forward-filled date gaps per product')

    # ── Remove duplicates ──
    before = len(df)
    df = df.drop_duplicates(subset=['date', 'product_name'], keep='last')
    dupes = before - len(df)
    if dupes > 0:
        report['issues_fixed'].append(f'Removed {dupes} duplicate rows')

    # ── Drop rows with null product_name ──
    df = df.dropna(subset=['product_name'])

    # ── Auto-derive day/month ──
    df['day_of_week'] = pd.to_datetime(df['date']).dt.day_name()
    df['month'] = pd.to_datetime(df['date']).dt.strftime('%B')

    # ── Clamp negatives ──
    for col in ['stock_remaining', 'units_consumed', 'stock_added']:
        if col in df.columns:
            neg_count = (df[col] < 0).sum()
            if neg_count > 0:
                df[col] = df[col].clip(lower=0)
                report['issues_fixed'].append(f'Clamped {neg_count} negative values in {col}')

    report['rows_output'] = len(df)

    # Compute frontend-expected summary fields
    dupes_str = [s for s in report['issues_fixed'] if 'duplicate' in s.lower()]
    gaps_str = [s for s in report['issues_fixed'] if 'gap' in s.lower() or 'forward-fill' in s.lower()]
    report['rows_used'] = len(df)
    report['duplicates_removed'] = int(dupes_str[0].split()[1]) if dupes_str else 0
    report['gaps_filled'] = len(gaps_str)
    # Quality score: Good if few issues, Fair if some, Poor if many
    total_issues = len(report.get('issues_flagged', []))
    report['quality_score'] = 'Good' if total_issues == 0 else ('Fair' if total_issues <= 2 else 'Poor')

    return df, report
