from app import create_app
import json

app = create_app()
app.testing = True
client = app.test_client()

res = client.post('/api/auth/forgot-password', json={'email': 'samarjeetsingh3419@gmail.com'})
print("Forgot Password Status:", res.status_code)
print("Forgot Password Response:", res.data.decode('utf-8'))

