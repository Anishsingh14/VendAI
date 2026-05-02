"""
VendAI — Email Alert Sender (Gmail SMTP)
Professional light-mode template optimized for Gmail Primary inbox delivery.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv('GMAIL_USER')
GMAIL_APP_PASSWORD = os.getenv('GMAIL_APP_PASSWORD')
APP_URL = os.getenv('APP_URL', 'http://localhost:5000')
SENDER_NAME = 'VendAI'


def _send_email(to_email: str, subject: str, html_body: str, plain_body: str = ''):
    """Send email via Gmail SMTP with proper deliverability headers."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print(f"[EmailSender] Credentials not set. Skipping email to {to_email}")
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr((SENDER_NAME, GMAIL_USER))
    msg['To'] = to_email
    msg['Reply-To'] = GMAIL_USER

    # Plain text version (critical for Primary inbox)
    if not plain_body:
        plain_body = f"VendAI Alert\n\n{subject}\n\nView dashboard: {APP_URL}"
    msg.attach(MIMEText(plain_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())


def _email_template(header_text: str, header_color: str, body_html: str, cta_text: str = '', cta_url: str = ''):
    """Professional light-mode email template optimized for Gmail."""
    cta_block = ''
    if cta_text:
        cta_block = f'''
        <tr><td style="padding:24px 0 0;">
          <a href="{cta_url or APP_URL}" style="display:inline-block;padding:12px 28px;background-color:#4F46E5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;" target="_blank">{cta_text}</a>
        </td></tr>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background-color:{header_color};padding:28px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">{header_text}</td>
        <td align="right" style="font-size:13px;color:rgba(255,255,255,0.8);font-weight:500;">VendAI</td>
      </tr>
    </table>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;color:#334155;font-size:15px;line-height:1.7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td>{body_html}</td></tr>
      {cta_block}
    </table>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;background-color:#FAFBFC;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:12px;color:#94A3B8;">VendAI &middot; Campus Vending Intelligence</td>
        <td align="right" style="font-size:12px;color:#94A3B8;">
          <a href="{APP_URL}" style="color:#4F46E5;text-decoration:none;">Open Dashboard</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>'''


def _info_row(label: str, value: str, color: str = '#1E293B') -> str:
    """Create a styled info row for email body."""
    return f'''<tr>
      <td style="padding:8px 0;font-size:13px;color:#64748B;font-weight:500;width:140px;vertical-align:top;">{label}</td>
      <td style="padding:8px 0;font-size:14px;color:{color};font-weight:600;">{value}</td>
    </tr>'''


def send_warning_alert(to_email, vendor_name, machine_name, machine_location, product_name, current_stock, predicted_yellow_date):
    """Send half-stock warning email."""
    subject = f"Stock Alert: {product_name} at {machine_location}"
    body = f'''
    <p style="margin:0 0 16px;">Hi {vendor_name},</p>
    <p style="margin:0 0 20px;">A product is predicted to reach <strong>50% depletion</strong> soon. Plan your restocking accordingly.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin-bottom:20px;">
      {_info_row('Machine', f'{machine_name} ({machine_location})')}
      {_info_row('Product', product_name)}
      {_info_row('Current Stock', f'{current_stock} units')}
      {_info_row('Predicted 50% Date', predicted_yellow_date, '#D97706')}
    </table>'''
    plain = f"Hi {vendor_name},\n\nStock Alert: {product_name} at {machine_name} ({machine_location})\nCurrent stock: {current_stock} units\nPredicted 50% date: {predicted_yellow_date}\n\nView dashboard: {APP_URL}"
    _send_email(to_email, subject, _email_template('Stock Warning', '#D97706', body, 'View Dashboard', APP_URL), plain)


def send_critical_alert(to_email, vendor_name, machine_name, machine_location, product_name, current_stock, predicted_red_date, is_priority=False):
    """Send critical stock alert email."""
    priority_text = '<p style="margin:0 0 12px;padding:10px 14px;background-color:#FEF2F2;border:1px solid #FECACA;border-radius:6px;color:#DC2626;font-size:13px;font-weight:600;">PRIORITY PRODUCT — Immediate action required</p>' if is_priority else ''
    subject = f"Critical: {product_name} running low at {machine_location}"
    body = f'''
    <p style="margin:0 0 16px;">Hi {vendor_name},</p>
    {priority_text}
    <p style="margin:0 0 20px;">Stock is predicted to reach <strong>critical levels</strong>. Restocking is strongly recommended.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-bottom:20px;">
      {_info_row('Machine', f'{machine_name} ({machine_location})')}
      {_info_row('Product', product_name)}
      {_info_row('Current Stock', f'{current_stock} units')}
      {_info_row('Predicted Stockout', predicted_red_date, '#DC2626')}
    </table>
    <p style="margin:0;font-weight:600;color:#1E293B;">Please restock as soon as possible.</p>'''
    plain = f"Hi {vendor_name},\n\nCRITICAL: {product_name} at {machine_name} ({machine_location})\nCurrent stock: {current_stock} units\nPredicted stockout: {predicted_red_date}\nPlease restock immediately.\n\nView dashboard: {APP_URL}"
    _send_email(to_email, subject, _email_template('Critical Stock Alert', '#DC2626', body, 'View Dashboard', APP_URL), plain)


def send_urgent_stockout_alert(to_email, vendor_name, machine_name, machine_location, product_name):
    """Send zero-stock urgent email."""
    subject = f"Urgent: {product_name} is empty at {machine_location}"
    body = f'''
    <p style="margin:0 0 16px;">Hi {vendor_name},</p>
    <p style="margin:0 0 20px;"><strong>Zero stock detected</strong> on latest upload. This slot is completely empty.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-bottom:20px;">
      {_info_row('Machine', f'{machine_name} ({machine_location})')}
      {_info_row('Product', product_name)}
      {_info_row('Stock', '0 units', '#DC2626')}
    </table>
    <p style="margin:0;font-weight:600;color:#DC2626;">Restock immediately.</p>'''
    plain = f"Hi {vendor_name},\n\nURGENT: {product_name} at {machine_name} ({machine_location}) is EMPTY.\nRestock immediately.\n\nView dashboard: {APP_URL}"
    _send_email(to_email, subject, _email_template('URGENT: Zero Stock', '#991B1B', body, 'View Dashboard', APP_URL), plain)


def send_test_alert(to_email, vendor_name):
    """Send test alert email to verify system works."""
    subject = f"VendAI Test Alert"
    body = f'''
    <p style="margin:0 0 16px;">Hi {vendor_name},</p>
    <p style="margin:0 0 20px;">Your VendAI alert system is working correctly. This is a <strong>test-only</strong> message.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:16px;margin-bottom:20px;">
      {_info_row('Machine', 'Main Block Vending (Sample)')}
      {_info_row('Product', 'Sanitary Pad (Sample)')}
      {_info_row('Status', 'TEST — Not a real alert', '#4F46E5')}
    </table>'''
    plain = f"Hi {vendor_name},\n\nYour VendAI alert system is working correctly.\nThis is a test-only message.\n\nView dashboard: {APP_URL}"
    _send_email(to_email, subject, _email_template('Alert System Test', '#4F46E5', body, 'Open Dashboard', APP_URL), plain)
