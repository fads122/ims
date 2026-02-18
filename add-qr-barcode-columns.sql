-- Add QR Code and Barcode columns to operational_equipment table
ALTER TABLE operational_equipment 
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add QR Code and Barcode columns to for_sale_products table
ALTER TABLE for_sale_products 
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add QR Code and Barcode columns to package_bundles table
ALTER TABLE package_bundles 
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add comments for documentation
COMMENT ON COLUMN operational_equipment.qr_code IS 'Base64-encoded QR code data URL. Format: {serial_number}-{equipment_name}';
COMMENT ON COLUMN operational_equipment.barcode IS 'Base64-encoded barcode data URL. Format: CODE128 using serial_number';
COMMENT ON COLUMN for_sale_products.qr_code IS 'Base64-encoded QR code data URL';
COMMENT ON COLUMN for_sale_products.barcode IS 'Base64-encoded barcode data URL';
COMMENT ON COLUMN package_bundles.qr_code IS 'Base64-encoded QR code data URL';
COMMENT ON COLUMN package_bundles.barcode IS 'Base64-encoded barcode data URL';

