# Supplier Table Setup Instructions

## Quick Fix: Create the Suppliers Table

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor** (left sidebar)

2. **Run this SQL:**

```sql
-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  address TEXT NOT NULL,
  facebook_page VARCHAR(255),
  viber VARCHAR(255),
  telegram VARCHAR(255),
  instagram VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
```

3. **Enable Row Level Security (Optional for now):**

If you want to enable RLS later, you can run:

```sql
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your security needs)
CREATE POLICY "Allow all operations" ON suppliers FOR ALL USING (true) WITH CHECK (true);
```

4. **Verify the table was created:**
   - Go to **Table Editor** in Supabase
   - You should see the `suppliers` table listed

## After Creating the Table

Refresh your browser and the supplier list page should work. You'll see an empty table if no suppliers exist yet, which is normal.

