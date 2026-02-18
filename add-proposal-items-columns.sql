-- Migration script to add new columns to proposal_items table
-- Run this if you've already created the tables and need to add the new fields

-- Add new columns to proposal_items table if they don't exist
ALTER TABLE proposal_items 
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5, 2) DEFAULT 20,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS available_stock INTEGER,
ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- Update existing rows to have default values
UPDATE proposal_items 
SET 
  profit_margin = 20,
  status = 'approved'
WHERE profit_margin IS NULL OR status IS NULL;

