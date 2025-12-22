# Supabase Setup Instructions

## 1. Create Tables in Supabase

Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor:

```sql
-- Operational Equipment Table
CREATE TABLE IF NOT EXISTS operational_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  model VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 0,
  box_quantity INTEGER DEFAULT 0,
  serial_number VARCHAR(255) NOT NULL,
  date_acquired DATE,
  condition VARCHAR(50) NOT NULL,
  damage_status VARCHAR(50) DEFAULT 'Not Damaged',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For Sale Products Table
CREATE TABLE IF NOT EXISTS for_sale_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(255),
  product_model VARCHAR(255),
  product_brand VARCHAR(255),
  supplier VARCHAR(255) NOT NULL,
  supplier_cost DECIMAL(10, 2) NOT NULL,
  srp DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  box_quantity INTEGER DEFAULT 0,
  location VARCHAR(255) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  description TEXT,
  brochure_url TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package/Bundle Deals Table
CREATE TABLE IF NOT EXISTS package_bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ownership_type VARCHAR(255),
  package_name VARCHAR(255) NOT NULL,
  package_category VARCHAR(255),
  package_contents JSONB DEFAULT '[]',
  package_description TEXT,
  supplier VARCHAR(255),
  cost DECIMAL(10, 2),
  srp DECIMAL(10, 2),
  quantity INTEGER DEFAULT 0,
  location VARCHAR(255),
  condition VARCHAR(50),
  brochure_url TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_operational_equipment_name ON operational_equipment(name);
CREATE INDEX IF NOT EXISTS idx_operational_equipment_serial ON operational_equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_for_sale_products_category ON for_sale_products(category);
CREATE INDEX IF NOT EXISTS idx_for_sale_products_supplier ON for_sale_products(supplier);
CREATE INDEX IF NOT EXISTS idx_package_bundles_name ON package_bundles(package_name);
```

## 2. Set Up Environment Variables

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under "API".

## 3. Enable Row Level Security (RLS)

In Supabase, go to Authentication > Policies and enable RLS for each table, or create policies that allow INSERT and SELECT operations for authenticated users.

For development, you can temporarily disable RLS or create permissive policies:

```sql
-- Allow all operations for now (adjust based on your security needs)
ALTER TABLE operational_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE for_sale_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_bundles ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Allow all operations" ON operational_equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON for_sale_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON package_bundles FOR ALL USING (true) WITH CHECK (true);
```

## API Endpoints

- `POST /api/products` - Add a new product
  - Body: `{ type: "operational" | "for-sale" | "package", data: {...} }`

- `GET /api/products` - Get all products
  - Query params: `?type=operational` (optional, filters by type)

