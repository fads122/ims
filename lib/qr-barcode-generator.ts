/**
 * QR Code and Barcode Generator Utility
 * Generates QR codes and barcodes as base64 data URLs
 * Works in Node.js server environment
 */

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Use QR code API service
    const qrSize = 256;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(data)}&format=png`;
    
    // Fetch the QR code image
    const response = await fetch(qrApiUrl);
    if (!response.ok) {
      throw new Error(`Failed to generate QR code: ${response.status} ${response.statusText}`);
    }
    
    // Convert response to buffer (Node.js compatible)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export async function generateBarcode(data: string): Promise<string> {
  try {
    // Use barcode API service (Code128 format)
    const barcodeApiUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(data)}&code=Code128&dpi=96&dataseparator=`;
    
    const response = await fetch(barcodeApiUrl);
    if (!response.ok) {
      throw new Error(`Failed to generate barcode: ${response.status} ${response.statusText}`);
    }
    
    // Convert response to buffer (Node.js compatible)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    return dataUrl;
  } catch (error) {
    console.error("Error generating barcode:", error);
    throw error;
  }
}

/**
 * Generate QR code for operational equipment
 * Format: {serial_number}-{equipment_name}
 */
export async function generateEquipmentQRCode(serialNumber: string, equipmentName: string): Promise<string> {
  const qrData = `${serialNumber}-${equipmentName}`;
  return generateQRCode(qrData);
}

/**
 * Generate barcode for equipment
 * Format: CODE128 using serial_number
 */
export async function generateEquipmentBarcode(serialNumber: string): Promise<string> {
  return generateBarcode(serialNumber);
}

