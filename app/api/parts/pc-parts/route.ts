import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch all PC parts/equipment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Fetch from all three tables
    const [operational, forSale, packages] = await Promise.all([
      supabase
        .from("operational_equipment")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("for_sale_products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("package_bundles")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    // Transform to unified format
    const allParts: any[] = [];

    // Operational equipment
    if (operational.data) {
      operational.data.forEach((item) => {
        allParts.push({
          id: item.id,
          name: item.name || "Unknown",
          model: item.model || "",
          brand: item.brand || "",
          supplier: "",
          supplier_cost: 0,
          price: 0, // Operational equipment doesn't have SRP
          srp: 0,
          quantity: item.quantity || 0,
          image: item.images?.[0] || null,
          is_package: false,
          package_category: null,
          description: null,
          type: "operational",
          category: item.product_type || "Other",
          condition: item.condition,
        });
      });
    }

    // For-sale products
    if (forSale.data) {
      forSale.data.forEach((item) => {
        allParts.push({
          id: item.id,
          name: item.product_model || "Unknown",
          model: item.product_model || "",
          brand: item.product_brand || "",
          supplier: item.supplier || "",
          supplier_cost: item.supplier_cost || 0,
          price: item.srp || 0,
          srp: item.srp || 0,
          quantity: item.quantity || 0,
          image: item.images?.[0] || null,
          is_package: false,
          package_category: null,
          description: item.description || null,
          type: "for-sale",
          category: item.category || "Other",
          condition: item.condition,
        });
      });
    }

    // Package bundles
    if (packages.data) {
      packages.data.forEach((item) => {
        allParts.push({
          id: item.id,
          name: item.package_name || "Unknown",
          model: "",
          brand: "",
          supplier: item.supplier || "",
          supplier_cost: item.cost || 0,
          price: item.srp || 0,
          srp: item.srp || 0,
          quantity: item.quantity || 0,
          image: item.images?.[0] || null,
          is_package: true,
          package_category: item.package_category || "Package/Bundle",
          description: item.package_description || null,
          type: "package",
          category: item.package_category || "Package/Bundle",
          condition: item.condition,
        });
      });
    }

    // Apply filters
    let filteredParts = allParts;

    if (category && category !== "all") {
      filteredParts = filteredParts.filter((part) => part.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredParts = filteredParts.filter(
        (part) =>
          part.name.toLowerCase().includes(searchLower) ||
          part.model.toLowerCase().includes(searchLower) ||
          part.brand.toLowerCase().includes(searchLower) ||
          part.supplier.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ data: filteredParts }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching PC parts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

