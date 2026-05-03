from backend.supabase_client import supabase_admin
res = supabase_admin.table('products').select('*').eq('product_name', 'Bingo Mad Angles').execute()
print("Products for Bingo:", res.data)
