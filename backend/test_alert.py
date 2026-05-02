import sys
from app import create_app
import json

app = create_app()
app.testing = True
client = app.test_client()

# We need to simulate the X-User-ID header
res = client.post('/api/auth/test-alert', headers={'X-User-ID': '12345678-1234-1234-1234-123456789012'})
print("Status:", res.status_code)
print("Data:", res.data)

