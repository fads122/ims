-- Saved Equipment Table
-- Stores user-saved equipment lists for quick access

CREATE TABLE IF NOT EXISTS saved_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_equipment_user_id ON saved_equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_equipment_timestamp ON saved_equipment(timestamp DESC);

-- Add comments
COMMENT ON TABLE saved_equipment IS 'Stores user-saved equipment lists for the Parts Picker';
COMMENT ON COLUMN saved_equipment.items IS 'JSON array of selected equipment/parts';
COMMENT ON COLUMN saved_equipment.title IS 'User-provided title for the saved equipment list';

