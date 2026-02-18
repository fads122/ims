-- Users table for QSales auth (run in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optional: RLS (Row Level Security) - enable if you want Supabase Auth to manage access
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
