-- Pricing History Table
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  product_type VARCHAR(50) NOT NULL, -- 'operational', 'for-sale', 'package'
  supplier_cost DECIMAL(10, 2),
  srp DECIMAL(10, 2),
  cost DECIMAL(10, 2), -- For packages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pricing_history_product ON pricing_history(product_id, product_type);
CREATE INDEX IF NOT EXISTS idx_pricing_history_created_at ON pricing_history(created_at);

-- Add comments for documentation
COMMENT ON TABLE pricing_history IS 'Tracks pricing changes over time for all product types';
COMMENT ON COLUMN pricing_history.product_id IS 'References the product ID from operational_equipment, for_sale_products, or package_bundles';
COMMENT ON COLUMN pricing_history.product_type IS 'Type of product: operational, for-sale, or package';
COMMENT ON COLUMN pricing_history.supplier_cost IS 'Supplier cost (for for-sale products)';
COMMENT ON COLUMN pricing_history.srp IS 'Suggested Retail Price';
COMMENT ON COLUMN pricing_history.cost IS 'Cost (for packages)';

