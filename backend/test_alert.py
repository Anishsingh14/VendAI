from app import create_app
import json

app = create_app()
app.testing = True
client = app.test_client()

# Need to mock the user ID in the headers to get the email correctly, but let's see.
# I'll just look at the code.
