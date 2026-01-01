import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// POST - Apply cost updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, update_reason } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Updates array is required" }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: Array<{ equipment_id: string; error: string }> = [];

    for (const update of updates) {
      const { equipment_id, equipment_type, new_supplier_cost } = update;

      if (!equipment_id || !equipment_type || new_supplier_cost === undefined) {
        failCount++;
        errors.push({
          equipment_id: equipment_id || "unknown",
          error: "Missing required fields",
        });
        continue;
      }

      try {
        const newCost = Number(new_supplier_cost);

        if (equipment_type === "for-sale") {
          // Get current data BEFORE update for pricing history
          const { data: currentProduct, error: fetchError } = await supabase
            .from("for_sale_products")
            .select("supplier_cost, srp, supplier")
            .eq("id", equipment_id)
            .single();

          if (fetchError) throw fetchError;
          if (!currentProduct) throw new Error("Product not found");

          const oldCost = Number(currentProduct.supplier_cost) || 0;

          // Only update if cost actually changed
          if (oldCost !== newCost) {
            // Update equipment cost
            const { error: updateError } = await supabase
              .from("for_sale_products")
              .update({ supplier_cost: newCost })
              .eq("id", equipment_id);

            if (updateError) throw updateError;

            // Add to pricing history - ensure this always happens
            const { error: historyError } = await supabase.from("pricing_history").insert({
              product_id: equipment_id,
              product_type: "for-sale",
              supplier_cost: newCost,
              srp: currentProduct.srp || null,
            });

            if (historyError) {
              console.error(`Failed to log pricing history for ${equipment_id}:`, historyError);
              // Don't fail the update if history logging fails, but log the error
            }

            successCount++;
          } else {
            // Cost didn't change, but still count as success
            successCount++;
          }
        } else if (equipment_type === "package") {
          // Get current data BEFORE update for pricing history
          const { data: currentPackage, error: fetchError } = await supabase
            .from("package_bundles")
            .select("cost, srp, supplier")
            .eq("id", equipment_id)
            .single();

          if (fetchError) throw fetchError;
          if (!currentPackage) throw new Error("Package not found");

          const oldCost = Number(currentPackage.cost) || 0;

          // Only update if cost actually changed
          if (oldCost !== newCost) {
            // Update package cost
            const { error: updateError } = await supabase
              .from("package_bundles")
              .update({ cost: newCost })
              .eq("id", equipment_id);

            if (updateError) throw updateError;

            // Add to pricing history - ensure this always happens
            const { error: historyError } = await supabase.from("pricing_history").insert({
              product_id: equipment_id,
              product_type: "package",
              cost: newCost,
              srp: currentPackage.srp || null,
            });

            if (historyError) {
              console.error(`Failed to log pricing history for ${equipment_id}:`, historyError);
              // Don't fail the update if history logging fails, but log the error
            }

            successCount++;
          } else {
            // Cost didn't change, but still count as success
            successCount++;
          }
        } else {
          failCount++;
          errors.push({
            equipment_id,
            error: `Unsupported equipment type: ${equipment_type}`,
          });
        }
      } catch (error: unknown) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({
          equipment_id,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      data: {
        total_updates: updates.length,
        successful_updates: successCount,
        failed_updates: failCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to apply updates";
    console.error("Error applying updates:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

