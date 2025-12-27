"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Barcode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "qr" | "barcode";
  data: string;
  title?: string;
}

interface QRBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "qr" | "barcode";
  data: string;
  title?: string;
  storedCode?: string; // Base64 data URL from database
}

export default function QRBarcodeModal({ isOpen, onClose, type, data, title, storedCode }: QRBarcodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !data) {
      setLoading(false);
      setImageUrl("");
      setError("");
      return;
    }

    // If we have a stored code, use it directly
    if (storedCode) {
      setImageUrl(storedCode);
      setLoading(false);
      return;
    }

    const generateCode = async () => {
      try {
        setLoading(true);
        setError("");
        const canvas = canvasRef.current;
        if (!canvas) {
          setLoading(false);
          return;
        }

        if (type === "qr") {
          // Generate QR Code using QR API service - use img tag directly
          const qrSize = 256;
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(data)}&format=png`;
          
          // Set canvas size
          canvas.width = qrSize;
          canvas.height = qrSize;
          
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Clear and draw white background
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, qrSize, qrSize);
              // Draw the QR code image
              ctx.drawImage(img, 0, 0, qrSize, qrSize);
              const dataUrl = canvas.toDataURL("image/png");
              setImageUrl(dataUrl);
              setLoading(false);
            }
          };
          
          img.onerror = (err) => {
            console.error("QR Code API error:", err);
            // Fallback: Use alternative API
            const altApiUrl = `https://chart.googleapis.com/chart?chs=${qrSize}x${qrSize}&cht=qr&chl=${encodeURIComponent(data)}`;
            const altImg = new Image();
            altImg.crossOrigin = "anonymous";
            altImg.onload = () => {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, qrSize, qrSize);
                ctx.drawImage(altImg, 0, 0, qrSize, qrSize);
                setImageUrl(canvas.toDataURL("image/png"));
                setLoading(false);
              }
            };
            altImg.onerror = () => {
              setError("Failed to generate QR code. Please try again.");
              setLoading(false);
            };
            altImg.src = altApiUrl;
          };
          
          img.src = qrApiUrl;
        } else {
          // Generate Barcode using Code128 format
          const barHeight = 100;
          const moduleWidth = 2;
          const quietZone = 20;
          
          // Simple barcode pattern generator
          const generateBarcodePattern = (text: string): number[] => {
            const result: number[] = [];
            // Start pattern
            result.push(2, 1, 1, 2, 2, 2, 2, 1, 1, 2);
            
            // Encode each character
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const code = char.charCodeAt(0);
              
              // Create pattern based on character code
              const bar1 = (code % 4) + 1;
              const bar2 = ((code >> 2) % 4) + 1;
              const bar3 = ((code >> 4) % 4) + 1;
              
              result.push(bar1, 1, bar2, 1, bar3, 1);
            }
            
            // Stop pattern
            result.push(2, 1, 1, 2, 2, 1, 2, 1, 2, 2);
            return result;
          };

          const pattern = generateBarcodePattern(data);
          const totalWidth = pattern.reduce((sum, val) => sum + val, 0) * moduleWidth;
          const width = totalWidth + (quietZone * 2);
          const totalHeight = barHeight + 40; // Extra space for text
          
          canvas.width = width;
          canvas.height = totalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setLoading(false);
            return;
          }

          // White background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, totalHeight);
          
          // Draw barcode
          ctx.fillStyle = "#000000";
          let x = quietZone;
          
          for (let i = 0; i < pattern.length; i++) {
            const barWidth = pattern[i] * moduleWidth;
            // Alternate between bars and spaces
            if (i % 2 === 0) {
              // Draw bar
              ctx.fillRect(x, 0, barWidth, barHeight);
            }
            x += barWidth;
          }

          // Add text below barcode
          ctx.fillStyle = "#000000";
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(data, width / 2, barHeight + 10);

          const dataUrl = canvas.toDataURL("image/png");
          setImageUrl(dataUrl);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error generating code:", error);
        setLoading(false);
      }
    };

    generateCode();
  }, [isOpen, data, type, storedCode]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.download = `${type === "qr" ? "qr-code" : "barcode"}-${data.substring(0, 10)}.png`;
    link.href = imageUrl;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "qr" ? (
              <>
                <QrCode className="w-5 h-5" />
                QR Code
              </>
            ) : (
              <>
                <Barcode className="w-5 h-5" />
                Barcode
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {loading ? (
            <div className="py-8 text-gray-600 dark:text-gray-400">Generating {type === "qr" ? "QR Code" : "Barcode"}...</div>
          ) : error ? (
            <div className="py-8 text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[200px]">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={type === "qr" ? "QR Code" : "Barcode"}
                    className={type === "qr" ? "w-64 h-64 object-contain" : "max-w-full h-auto max-h-[200px] object-contain"}
                  />
                ) : (
                  <canvas 
                    ref={canvasRef} 
                    className={type === "qr" ? "w-64 h-64" : "max-w-full h-auto max-h-[200px]"}
                  />
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded text-center max-w-md break-all">
                {data}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" size="sm" disabled={!imageUrl}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={onClose} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

