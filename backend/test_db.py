import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)
res = supabase.table('machines').select('*').limit(1).execute()
print(res.data)
