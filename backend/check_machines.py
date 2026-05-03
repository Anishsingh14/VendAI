from supabase_client import supabase_admin

res = supabase_admin.table('machines').select('*').execute()
print(res.data)
