import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// POST - Preview cost updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Updates array is required" }, { status: 400 });
    }

    const previewData: Array<{
      equipment_id: string;
      equipment_type: string;
      current_data: {
        name?: string;
        product_model?: string;
        product_brand?: string;
        brand?: string;
        model?: string;
        supplier_cost: number;
        srp?: number;
        cost?: number;
        supplier?: string;
      };
      new_data: {
        supplier_cost: number;
      };
      changes: {
        supplier_cost_change: number;
        supplier_cost_percentage: string;
      };
    }> = [];

    for (const update of updates) {
      const { equipment_id, equipment_type, new_supplier_cost } = update;

      if (!equipment_id || !equipment_type || new_supplier_cost === undefined) {
        continue;
      }

      // Fetch current equipment data
      let currentData: any = null;
      if (equipment_type === "for-sale") {
        const { data, error } = await supabase
          .from("for_sale_products")
          .select("id, product_model, product_brand, supplier_cost, srp, supplier")
          .eq("id", equipment_id)
          .single();

        if (!error && data) {
          currentData = {
            product_model: data.product_model,
            product_brand: data.product_brand,
            supplier_cost: Number(data.supplier_cost) || 0,
            srp: Number(data.srp) || 0,
            supplier: data.supplier,
          };
        }
      } else if (equipment_type === "package") {
        const { data, error } = await supabase
          .from("package_bundles")
          .select("id, package_name, cost, srp, supplier")
          .eq("id", equipment_id)
          .single();

        if (!error && data) {
          currentData = {
            name: data.package_name,
            cost: Number(data.cost) || 0,
            srp: Number(data.srp) || 0,
            supplier: data.supplier,
          };
        }
      }

      if (currentData) {
        const currentCost = currentData.supplier_cost || currentData.cost || 0;
        const newCost = Number(new_supplier_cost);
        const costChange = newCost - currentCost;
        const costPercentage =
          currentCost > 0 ? ((costChange / currentCost) * 100).toFixed(2) : "0.00";

        previewData.push({
          equipment_id,
          equipment_type,
          current_data: currentData,
          new_data: {
            supplier_cost: newCost,
          },
          changes: {
            supplier_cost_change: costChange,
            supplier_cost_percentage: costPercentage,
          },
        });
      }
    }

    return NextResponse.json({
      data: previewData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to preview updates";
    console.error("Error previewing updates:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

