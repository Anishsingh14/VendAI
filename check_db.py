import os
import sys
from backend.supabase_client import supabase_admin

try:
    res = supabase_admin.table('machines').select('*').execute()
    print("Machines data:")
    for m in res.data:
        print(m)
except Exception as e:
    print(f"Error: {e}")
