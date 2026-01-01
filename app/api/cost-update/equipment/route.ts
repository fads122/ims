import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch all equipment for manual update
export async function GET(request: NextRequest) {
  try {
    // Fetch for-sale products
    const { data: forSaleProducts, error: forSaleError } = await supabase
      .from("for_sale_products")
      .select("id, product_model, product_brand, supplier_cost, srp, supplier, category")
      .order("product_brand")
      .order("product_model");

    if (forSaleError && !forSaleError.message?.includes("does not exist")) {
      console.error("Error fetching for-sale products:", forSaleError);
    }

    // Fetch packages
    const { data: packages, error: packagesError } = await supabase
      .from("package_bundles")
      .select("id, package_name, cost, srp, supplier, package_category")
      .order("package_name");

    if (packagesError && !packagesError.message?.includes("does not exist")) {
      console.error("Error fetching packages:", packagesError);
    }

    const equipment = [
      ...(forSaleProducts || []).map((p) => ({
        id: p.id,
        equipment_type: "for-sale" as const,
        name: p.product_model || "",
        brand: p.product_brand || "",
        model: p.product_model || "",
        category: p.category || "",
        supplier_cost: Number(p.supplier_cost) || 0,
        srp: Number(p.srp) || 0,
        supplier: p.supplier || "",
      })),
      ...(packages || []).map((p) => ({
        id: p.id,
        equipment_type: "package" as const,
        name: p.package_name || "",
        brand: "",
        model: "",
        category: p.package_category || "",
        supplier_cost: Number(p.cost) || 0,
        srp: Number(p.srp) || 0,
        supplier: p.supplier || "",
      })),
    ];

    return NextResponse.json({
      data: equipment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch equipment";
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

