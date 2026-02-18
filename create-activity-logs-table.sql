-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User Information
  user_id UUID,
  user_email VARCHAR(255) NOT NULL,
  
  -- Activity Details
  activity_type VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'view', etc.
  entity_type VARCHAR(100) NOT NULL,   -- 'equipment', 'proposal', 'client', 'product', etc.
  entity_id UUID,                      -- ID of the affected entity
  
  -- Activity Description
  description TEXT NOT NULL,           -- Human-readable description
  action_details JSONB DEFAULT '{}'::jsonb, -- Additional details (old values, new values, etc.)
  
  -- Metadata
  ip_address VARCHAR(45),             -- IPv4 or IPv6
  user_agent TEXT,                    -- Browser/client info
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_deleted_at ON activity_logs(deleted_at) WHERE deleted_at IS NULL;

-- Create function to automatically update updated_at (if needed in future)
-- For now, we only use created_at

COMMENT ON TABLE activity_logs IS 'Stores all system activities and user actions for audit trail';
COMMENT ON COLUMN activity_logs.activity_type IS 'Type of activity: create, update, delete, view, export, etc.';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected: equipment, proposal, client, product, etc.';
COMMENT ON COLUMN activity_logs.action_details IS 'JSON object containing additional activity details like old/new values';

