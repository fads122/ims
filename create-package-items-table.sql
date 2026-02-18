-- Package Items Table (to store items within packages)
CREATE TABLE IF NOT EXISTS package_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL,
  item_category VARCHAR(255) NOT NULL,
  item_model VARCHAR(255) NOT NULL,
  item_brand VARCHAR(255) NOT NULL,
  item_quantity INTEGER DEFAULT 1,
  item_condition VARCHAR(50) DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint (if package_bundles table exists)
-- ALTER TABLE package_items ADD CONSTRAINT fk_package FOREIGN KEY (package_id) REFERENCES package_bundles(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);




















