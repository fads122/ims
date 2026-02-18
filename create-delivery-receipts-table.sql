-- Create delivery_receipts table
CREATE TABLE IF NOT EXISTS delivery_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Project/Proposal Link
  project_id UUID, -- Can reference projects table if it exists
  proposal_id UUID, -- References project_proposals table
  project_name VARCHAR(255) NOT NULL,
  
  -- Client Information
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(100),
  client_address TEXT,
  
  -- Delivery Information
  delivery_date DATE NOT NULL, -- Expected delivery date
  delivered_date DATE, -- Actual delivery date
  delivered_time TIME, -- Actual delivery time
  received_by VARCHAR(255), -- Person who received the delivery
  status VARCHAR(50) NOT NULL DEFAULT 'Delivering', -- 'Delivering' or 'Delivered'
  
  -- File Attachment
  attached_file TEXT, -- URL to attached file (image/PDF)
  
  -- Metadata
  created_by UUID, -- Can reference users table if it exists
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_proposal_id ON delivery_receipts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_status ON delivery_receipts(status);
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_delivery_date ON delivery_receipts(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_receipts_deleted_at ON delivery_receipts(deleted_at) WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_delivery_receipts_updated_at ON delivery_receipts;
CREATE TRIGGER update_delivery_receipts_updated_at
  BEFORE UPDATE ON delivery_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_receipts_updated_at();

COMMENT ON TABLE delivery_receipts IS 'Stores delivery receipts (sales orders) for project deliveries';
COMMENT ON COLUMN delivery_receipts.proposal_id IS 'References project_proposals table';
COMMENT ON COLUMN delivery_receipts.status IS 'Delivery status: Delivering or Delivered';


