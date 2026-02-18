-- Create project_proposals table
CREATE TABLE IF NOT EXISTS project_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Information
  proposal_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Client/Project Relationship
  client_id UUID, -- Can reference clients table if it exists in the future
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(100),
  client_address TEXT,
  project_id UUID, -- Can reference projects table if it exists in the future
  
  -- Proposal Details
  proposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, approved, rejected, archived
  
  -- Financial Information
  subtotal DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 12, -- Default 12% VAT
  total_amount DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'PHP',
  
  -- Terms and Conditions
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- Metadata
  created_by UUID, -- Can reference users table if it exists
  sent_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- File attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create proposal_items table
CREATE TABLE IF NOT EXISTS proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  proposal_id UUID NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
  
  -- Equipment/Product Information
  equipment_id UUID, -- Can reference operational_equipment, for_sale_products, or package_bundles
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  brand VARCHAR(100),
  model VARCHAR(100),
  category VARCHAR(100),
  
  -- Quantity and Pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Optional fields
  supplier VARCHAR(255),
  warranty_period VARCHAR(100),
  delivery_time VARCHAR(100),
  
  -- Project proposal specific fields
  profit_margin DECIMAL(5, 2) DEFAULT 20,
  actual_cost DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'approved', -- approved, rejected
  available_stock INTEGER,
  brochure_url TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_proposals_status ON project_proposals(status);
CREATE INDEX IF NOT EXISTS idx_project_proposals_client_id ON project_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_project_proposals_project_id ON project_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_project_proposals_created_by ON project_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_project_proposals_proposal_date ON project_proposals(proposal_date);
CREATE INDEX IF NOT EXISTS idx_project_proposals_deleted_at ON project_proposals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal_id ON proposal_items(proposal_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_project_proposals_updated_at ON project_proposals;
CREATE TRIGGER update_project_proposals_updated_at BEFORE UPDATE ON project_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate proposal number
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  counter INTEGER;
BEGIN
  counter := (SELECT COALESCE(MAX(CAST(SUBSTRING(proposal_number FROM 'PROP-(\d+)') AS INTEGER)), 0) 
              FROM project_proposals 
              WHERE proposal_number ~ '^PROP-\d+$') + 1;
  new_number := 'PROP-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE project_proposals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all non-deleted proposals
-- CREATE POLICY "Users can view proposals"
--   ON project_proposals FOR SELECT
--   USING (deleted_at IS NULL);

-- Policy: Users can create proposals
-- CREATE POLICY "Users can create proposals"
--   ON project_proposals FOR INSERT
--   WITH CHECK (true);

-- Policy: Users can update proposals
-- CREATE POLICY "Users can update proposals"
--   ON project_proposals FOR UPDATE
--   USING (deleted_at IS NULL);

-- Similar policies for proposal_items
-- CREATE POLICY "Users can view proposal items"
--   ON proposal_items FOR SELECT
--   USING (true);

-- CREATE POLICY "Users can manage proposal items"
--   ON proposal_items FOR ALL
--   USING (true);

