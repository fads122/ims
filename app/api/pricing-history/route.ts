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
    const aggregate = searchParams.get("aggregate") === "true";

    // If aggregate mode, return aggregated data across all products
    if (aggregate) {
      const { data, error } = await supabase
        .from("pricing_history")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date and aggregate values
      const groupedByDate: Record<string, {
        date: string;
        supplierCostSum: number;
        costSum: number;
        srpSum: number;
        count: number;
        created_at: string;
      }> = {};

      (data || []).forEach((item) => {
        const date = new Date(item.created_at);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = {
            date: dateKey,
            supplierCostSum: 0,
            costSum: 0,
            srpSum: 0,
            count: 0,
            created_at: item.created_at,
          };
        }

        if (item.supplier_cost) {
          groupedByDate[dateKey].supplierCostSum += Number(item.supplier_cost);
        }
        if (item.cost) {
          groupedByDate[dateKey].costSum += Number(item.cost);
        }
        if (item.srp) {
          groupedByDate[dateKey].srpSum += Number(item.srp);
        }
        groupedByDate[dateKey].count++;
      });

      // Convert to array and sort by date
      const aggregatedData = Object.values(groupedByDate)
        .map(item => ({
          date: item.date,
          supplier_cost: item.supplierCostSum,
          cost: item.costSum,
          srp: item.srpSum,
          created_at: item.created_at,
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return NextResponse.json({ data: aggregatedData || [] }, { status: 200 });
    }

    // Original single product mode
    if (!productId || !productType) {
      return NextResponse.json(
        { error: "productId and productType are required when not in aggregate mode" },
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
  } catch (error: unknown) {
    console.error("Error fetching pricing history:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

