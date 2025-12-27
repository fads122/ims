import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const productType = searchParams.get("productType");

    if (!productId || !productType) {
      return NextResponse.json(
        { error: "productId and productType are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pricing_history")
      .select("*")
      .eq("product_id", productId)
      .eq("product_type", productType)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching pricing history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

