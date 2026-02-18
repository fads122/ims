-- Borrow Requests Table
-- Stores equipment borrowing requests

CREATE TABLE IF NOT EXISTS borrow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  borrower_name VARCHAR(255) NOT NULL,
  borrower_department VARCHAR(255),
  borrower_contact VARCHAR(255),
  borrower_email VARCHAR(255),
  borrow_date DATE NOT NULL,
  return_date DATE NOT NULL,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'borrowed', -- 'borrowed', 'Returned', 'returned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Borrow Request Equipment Table
-- Links equipment items to borrow requests

CREATE TABLE IF NOT EXISTS borrow_request_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  borrow_request_id UUID NOT NULL REFERENCES borrow_requests(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL, -- References operational_equipment, for_sale_products, or package_bundles
  equipment_type VARCHAR(50) NOT NULL, -- 'operational', 'for-sale', 'package'
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Equipment Movements Table
-- Tracks equipment movements (borrowed/returned)

CREATE TABLE IF NOT EXISTS equipment_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL,
  equipment_type VARCHAR(50) NOT NULL, -- 'operational', 'for-sale', 'package'
  movement_type VARCHAR(50) NOT NULL, -- 'borrowed', 'returned'
  borrow_request_id UUID REFERENCES borrow_requests(id),
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  employee_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'returned'
  project_id UUID, -- Optional reference to projects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_borrow_requests_user_id ON borrow_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrow_date ON borrow_requests(borrow_date);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_return_date ON borrow_requests(return_date);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_deleted_at ON borrow_requests(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_borrow_request_equipment_borrow_request_id ON borrow_request_equipment(borrow_request_id);
CREATE INDEX IF NOT EXISTS idx_borrow_request_equipment_equipment_id ON borrow_request_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_borrow_request_equipment_deleted_at ON borrow_request_equipment(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_movements_equipment_id ON equipment_movements(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_borrow_request_id ON equipment_movements(borrow_request_id);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_movement_type ON equipment_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_equipment_movements_status ON equipment_movements(status);

-- Add comments
COMMENT ON TABLE borrow_requests IS 'Stores equipment borrowing requests';
COMMENT ON TABLE borrow_request_equipment IS 'Links equipment items to borrow requests';
COMMENT ON TABLE equipment_movements IS 'Tracks equipment movements for audit trail';

