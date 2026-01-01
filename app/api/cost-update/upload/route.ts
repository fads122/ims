import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI
const openai = process.env.cost_api_key
  ? new OpenAI({ apiKey: process.env.cost_api_key })
  : null;

// Extract text from PDF using pdfjs-dist (dynamic import to avoid worker issues)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Try multiple import paths for pdfjs-dist
    let pdfjsLib;
    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    } catch (e) {
      try {
        pdfjsLib = await import("pdfjs-dist");
      } catch (e2) {
        throw new Error("Could not import pdfjs-dist");
      }
    }
    
    // Disable worker to avoid file path issues
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      verbosity: 0, // Suppress warnings
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent({
          normalizeWhitespace: false, // Preserve spacing for tables
        });
        
        // Better text extraction that preserves table structure
        let pageText = "";
        let lastY = -1;
        let line = "";
        
        for (const item of textContent.items) {
          if ('str' in item && item.str) {
            const y = item.transform[5]; // Y position
            
            // If Y position changed significantly, start a new line
            if (lastY !== -1 && Math.abs(y - lastY) > 2) {
              pageText += line.trim() + "\n";
              line = "";
            }
            
            line += item.str + " ";
            lastY = y;
          }
        }
        
        // Add the last line
        if (line.trim()) {
          pageText += line.trim() + "\n";
        }
        
        fullText += pageText + "\n--- Page " + i + " ---\n\n";
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        // Continue with other pages
      }
    }

    if (!fullText.trim()) {
      throw new Error("No text could be extracted from PDF");
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to extract text from PDF: ${errorMessage}. The PDF may be image-based or corrupted.`);
  }
}

// Use AI to intelligently parse PDF text and extract equipment data
async function parsePDFWithAI(pdfText: string): Promise<Array<{
  model: string;
  brand: string;
  supplier_cost: number;
  extracted_from: string;
}>> {
  if (!openai) {
    // Fallback to basic parsing if OpenAI is not configured
    return parsePDFBasic(pdfText);
  }

  try {
    const prompt = `You are an expert at extracting equipment pricing data from PDF price lists, especially complex tables.

Extract ALL equipment items with their models, brands, and prices from the following text. The text may contain tables with multiple columns.

Return a JSON array of objects with this exact structure:
[
  {
    "model": "equipment model name",
    "brand": "brand name (or 'Unknown' if not found)",
    "supplier_cost": price as number,
    "extracted_from": "original line or cell from PDF"
  }
]

IMPORTANT RULES FOR TABLES:
- Tables may have multiple price columns (BP, DP, etc.) - extract ALL prices as separate entries
- Tables may have processor models with different motherboard combinations - each combination with a price should be a separate entry
- Brand names may appear as headers (like "GIGABYTE", "MSI", "ASUS") - apply the brand to all items in that section
- Model names can be in first column, prices in subsequent columns
- If a row has multiple prices (like different motherboard bundles), create separate entries for each price
- Processor + Motherboard combinations: Extract as "Processor Model + Motherboard Model" for the model field
- Video cards: Extract model name and all prices
- Printers/Ink: Extract model and prices

EXTRACTION RULES:
- Extract model names (product names, part numbers, processor models, etc.)
- Extract brand names (GIGABYTE, MSI, ASUS, AMD, Intel, Yeston, PNY, EPSON, etc.)
- Extract ALL prices found (numbers, can have commas like 3,695 or 18,465)
- For bundle prices: Extract processor model + motherboard model as the model name
- Only include items that have both a model/name and a price
- Ignore pure headers, footers, warranty info, and non-product lines
- Handle table structures: read across rows to match models with their prices

EXAMPLES:
- "RYZEN R5 5600G" with price "8375" → {"model": "RYZEN R5 5600G", "brand": "AMD", "supplier_cost": 8375}
- "GT1030 4GB DDR4" with price "3,695" → {"model": "GT1030 4GB DDR4", "brand": "Yeston", "supplier_cost": 3695}
- "EPSON L121 ECOTANK" with price "5,330" → {"model": "EPSON L121 ECOTANK A4 INK TANK PRINTER", "brand": "EPSON", "supplier_cost": 5330}

Return ONLY valid JSON array, no other text.

PDF Text:
${pdfText.substring(0, 20000)}`; // Increased limit for complex tables

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cheaper model
      messages: [
        {
          role: "system",
          content: "You are a data extraction expert. Extract equipment data and return it as a JSON array. Return ONLY the JSON array, no other text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let parsed;
    try {
      // Try to extract JSON from the response (in case it's wrapped)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole response
        const jsonObj = JSON.parse(content);
        // Check if it's wrapped in an object
        parsed = jsonObj.items || jsonObj.data || jsonObj.equipment || Object.values(jsonObj)[0] || [];
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback to basic parsing
      return parsePDFBasic(pdfText);
    }

    // Validate and format the extracted data
    if (!Array.isArray(parsed)) {
      return parsePDFBasic(pdfText);
    }

    return parsed
      .filter((item: any) => item && item.model && item.supplier_cost)
      .map((item: any) => ({
        model: String(item.model || "").trim(),
        brand: String(item.brand || "Unknown").trim(),
        supplier_cost: parseFloat(String(item.supplier_cost).replace(/[^\d.]/g, "")) || 0,
        extracted_from: String(item.extracted_from || item.model || "").trim(),
      }))
      .filter((item) => item.model && item.supplier_cost > 0);
  } catch (error) {
    console.error("Error parsing PDF with AI:", error);
    // Fallback to basic parsing
    return parsePDFBasic(pdfText);
  }
}

// Basic fallback parsing (original logic)
function parsePDFBasic(pdfText: string): Array<{
  model: string;
  brand: string;
  supplier_cost: number;
  extracted_from: string;
}> {
  const lines = pdfText.split("\n");
  const equipmentData: Array<{
    model: string;
    brand: string;
    supplier_cost: number;
    extracted_from: string;
  }> = [];
  let currentBrand = "";

  const brandPatterns = [
    /^(GIGABYTE|MSI|ASUS|ASROCK|BIOSTAR|Ramsta|CORSAIR|KINGSTON|SAMSUNG|WD|SEAGATE|INTEL|AMD|NVIDIA)/i,
  ];

  const pricePatterns = [
    /([A-Za-z0-9\s\-]+?)\s+(\d+\.?\d*)\s*$/,
    /([A-Za-z0-9\s\-]+?)\s+₱\s*(\d+\.?\d*)/,
    /([A-Za-z0-9\s\-]+?)\s+\$\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s+([A-Za-z0-9\s\-]+)/,
    /([A-Za-z0-9\s\-]+?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
  ];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    for (const pattern of brandPatterns) {
      const brandMatch = trimmedLine.match(pattern);
      if (brandMatch) {
        currentBrand = brandMatch[1].toUpperCase();
        return;
      }
    }

    if (trimmedLine.length < 5 || /^\d+$/.test(trimmedLine)) return;

    for (const pattern of pricePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        let extractedModel = "";
        let extractedPrice = 0;

        if (match[1] && match[2]) {
          if (/^\d+/.test(match[1])) {
            extractedPrice = parseFloat(match[1].replace(/,/g, ""));
            extractedModel = match[2].trim();
          } else {
            extractedModel = match[1].trim();
            extractedPrice = parseFloat(match[2].replace(/,/g, ""));
          }
        }

        if (extractedModel && extractedPrice > 0 && extractedPrice < 1000000) {
          equipmentData.push({
            model: extractedModel,
            brand: currentBrand || "Unknown",
            supplier_cost: extractedPrice,
            extracted_from: trimmedLine,
          });
          break;
        }
      }
    }
  });

  return equipmentData;
}

// Match extracted data to existing equipment
async function matchEquipmentData(extractedData: Array<{
  model: string;
  brand: string;
  supplier_cost: number;
  extracted_from: string;
}>) {
  const matchedData: Array<{
    model: string;
    brand: string;
    supplier_cost: number;
    extracted_from: string;
    matched_equipment: Array<{
      id: string;
      name?: string;
      product_model?: string;
      product_brand?: string;
      brand?: string;
      model?: string;
      supplier_cost: number;
      cost?: number;
      supplier?: string;
      equipment_type: "for-sale" | "package";
    }>;
    match_confidence: "high" | "medium" | "none";
  }> = [];

  const unmatchedData: Array<{
    model: string;
    brand: string;
    supplier_cost: number;
    extracted_from: string;
    matched_equipment: Array<never>;
    match_confidence: "none";
  }> = [];

  for (const item of extractedData) {
    const cleanModel = item.model.trim().toLowerCase();
    const cleanBrand = item.brand.trim().toLowerCase();

    let matches: Array<{
      id: string;
      name?: string;
      product_model?: string;
      product_brand?: string;
      brand?: string;
      model?: string;
      supplier_cost: number;
      cost?: number;
      supplier?: string;
      equipment_type: "for-sale" | "package";
    }> = [];

    // Strategy 1: Exact model match in for_sale_products
    const { data: exactMatches } = await supabase
      .from("for_sale_products")
      .select("id, product_model, product_brand, supplier_cost, supplier")
      .ilike("product_model", cleanModel);

    if (exactMatches && exactMatches.length > 0) {
      matches = exactMatches.map((m) => ({
        id: m.id,
        product_model: m.product_model || undefined,
        product_brand: m.product_brand || undefined,
        supplier_cost: Number(m.supplier_cost) || 0,
        supplier: m.supplier || undefined,
        equipment_type: "for-sale" as const,
      }));
    }

    // Strategy 2: Exact match in package_bundles
    if (matches.length === 0) {
      const { data: packageMatches } = await supabase
        .from("package_bundles")
        .select("id, package_name, cost, srp, supplier")
        .ilike("package_name", cleanModel);

      if (packageMatches && packageMatches.length > 0) {
        matches = packageMatches.map((m) => ({
          id: m.id,
          name: m.package_name || undefined,
          cost: Number(m.cost) || 0,
          supplier_cost: Number(m.cost) || 0,
          supplier: m.supplier || undefined,
          equipment_type: "package" as const,
        }));
      }
    }

    // Strategy 3: Partial model match
    if (matches.length === 0) {
      const { data: partialMatches } = await supabase
        .from("for_sale_products")
        .select("id, product_model, product_brand, supplier_cost, supplier")
        .or(`product_model.ilike.%${cleanModel}%,product_model.ilike.${cleanModel}%`);

      if (partialMatches && partialMatches.length > 0) {
        matches = partialMatches.map((m) => ({
          id: m.id,
          product_model: m.product_model || undefined,
          product_brand: m.product_brand || undefined,
          supplier_cost: Number(m.supplier_cost) || 0,
          supplier: m.supplier || undefined,
          equipment_type: "for-sale" as const,
        }));
      }
    }

    // Strategy 4: Brand + model combination
    if (matches.length === 0 && cleanBrand !== "unknown") {
      const { data: brandMatches } = await supabase
        .from("for_sale_products")
        .select("id, product_model, product_brand, supplier_cost, supplier")
        .or(`product_brand.ilike.%${cleanBrand}%,product_model.ilike.%${cleanModel}%`);

      if (brandMatches && brandMatches.length > 0) {
        matches = brandMatches.map((m) => ({
          id: m.id,
          product_model: m.product_model || undefined,
          product_brand: m.product_brand || undefined,
          supplier_cost: Number(m.supplier_cost) || 0,
          supplier: m.supplier || undefined,
          equipment_type: "for-sale" as const,
        }));
      }
    }

    if (matches.length > 0) {
      matchedData.push({
        ...item,
        matched_equipment: matches,
        match_confidence: matches.length === 1 ? "high" : "medium",
      });
    } else {
      unmatchedData.push({
        ...item,
        matched_equipment: [],
        match_confidence: "none",
      });
    }
  }

  return { matchedData, unmatchedData };
}

// POST - Upload and process PDF
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Read PDF buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using pdfjs-dist
    const pdfText = await extractTextFromPDF(buffer);

    // Use AI to intelligently parse the PDF text
    const extractedData = await parsePDFWithAI(pdfText);

    // Match to existing equipment
    const { matchedData, unmatchedData } = await matchEquipmentData(extractedData);

    return NextResponse.json({
      data: {
        extracted_count: extractedData.length,
        matched_count: matchedData.length,
        unmatched_count: unmatchedData.length,
        matched_data: matchedData,
        unmatched_data: unmatchedData,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process PDF";
    console.error("Error processing PDF:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
