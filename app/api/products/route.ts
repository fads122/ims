import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "operational") {
      // Validate required fields
      if (!data.name || !data.serialNumber || !data.condition || !data.quantity) {
        return NextResponse.json(
          { error: "Missing required fields: name, serialNumber, condition, and quantity are required" },
          { status: 400 }
        );
      }

      const { data: insertedData, error } = await supabase
        .from("operational_equipment")
        .insert({
          product_type: data.productType || null,
          name: data.name,
          brand: data.brand || null,
          model: data.model || null,
          quantity: data.quantity,
          box_quantity: data.boxQuantity || 0,
          serial_number: data.serialNumber,
          date_acquired: data.dateAcquired || null,
          condition: data.condition,
          damage_status: data.damageStatus || "Not Damaged",
          images: data.images || [],
        })
        .select()
        .single();

      if (error) throw error;
      
      return NextResponse.json({ success: true, data: insertedData }, { status: 201 });
    } else if (type === "for-sale") {
      const { error } = await supabase.from("for_sale_products").insert({
        category: data.category,
        product_model: data.productModel,
        product_brand: data.productBrand,
        supplier: data.supplier,
        supplier_cost: data.supplierCost,
        srp: data.srp,
        quantity: data.quantity,
        box_quantity: data.boxQuantity,
        location: data.location,
        condition: data.condition,
        description: data.description,
        brochure_url: data.brochureUrl,
        images: data.images || [],
      });

      if (error) throw error;
    } else if (type === "package") {
      const { error } = await supabase.from("package_bundles").insert({
        ownership_type: data.ownershipType,
        package_name: data.packageName,
        package_category: data.packageCategory,
        package_contents: data.packageContents || [],
        package_description: data.packageDescription,
        supplier: data.supplier,
        cost: data.cost,
        srp: data.srp,
        quantity: data.quantity,
        location: data.location,
        condition: data.condition,
        brochure_url: data.brochureUrl,
        images: data.images || [],
      });

      if (error) throw error;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let data;
    if (type === "operational") {
      const { data: products, error } = await supabase
        .from("operational_equipment")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      data = products;
    } else if (type === "for-sale") {
      const { data: products, error } = await supabase
        .from("for_sale_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      data = products;
    } else if (type === "package") {
      const { data: products, error } = await supabase
        .from("package_bundles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      data = products;
    } else {
      // Get all products
      const [operational, forSale, packages] = await Promise.all([
        supabase.from("operational_equipment").select("*").order("created_at", { ascending: false }),
        supabase.from("for_sale_products").select("*").order("created_at", { ascending: false }),
        supabase.from("package_bundles").select("*").order("created_at", { ascending: false }),
      ]);
      data = {
        operational: operational.data || [],
        forSale: forSale.data || [],
        packages: packages.data || [],
      };
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


