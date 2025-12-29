import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Fetch total suppliers
    const { count: suppliersCount, error: suppliersError } = await supabase
      .from("suppliers")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    if (suppliersError && !suppliersError.message?.includes("does not exist")) {
      console.error("Error fetching suppliers count:", suppliersError);
    }

    // Fetch total products (operational + for-sale + packages)
    const [operationalRes, forSaleRes, packagesRes] = await Promise.all([
      supabase.from("operational_equipment").select("*", { count: "exact", head: true }),
      supabase.from("for_sale_products").select("*", { count: "exact", head: true }),
      supabase.from("package_bundles").select("*", { count: "exact", head: true }),
    ]);

    const totalProducts =
      (operationalRes.count || 0) + (forSaleRes.count || 0) + (packagesRes.count || 0);

    // Fetch borrowed equipment count (active borrow requests)
    const { count: borrowedCount, error: borrowedError } = await supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .neq("status", "Returned")
      .neq("status", "returned")
      .is("deleted_at", null);

    if (borrowedError && !borrowedError.message?.includes("does not exist")) {
      console.error("Error fetching borrowed count:", borrowedError);
    }

    // Fetch equipment used in projects (approved proposal items)
    const { count: usedInProjectsCount, error: usedError } = await supabase
      .from("proposal_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .not("equipment_id", "is", null);

    if (usedError && !usedError.message?.includes("does not exist")) {
      console.error("Error fetching used in projects count:", usedError);
    }

    // Fetch top ranked supplier (supplier with most products)
    let topSupplier = null;
    try {
      const { data: suppliers, error: suppliersListError } = await supabase
        .from("suppliers")
        .select("id, supplier_name")
        .is("deleted_at", null)
        .eq("status", "Active")
        .limit(100);

      if (!suppliersListError && suppliers && suppliers.length > 0) {
        // Count products per supplier
        const supplierCounts: { [key: string]: { name: string; count: number } } = {};

        // Count in for_sale_products
        const { data: forSaleProducts } = await supabase
          .from("for_sale_products")
          .select("supplier")
          .not("supplier", "is", null);

        forSaleProducts?.forEach((product: any) => {
          const supplierName = product.supplier;
          if (supplierName) {
            if (!supplierCounts[supplierName]) {
              supplierCounts[supplierName] = { name: supplierName, count: 0 };
            }
            supplierCounts[supplierName].count += 1;
          }
        });

        // Count in package_bundles
        const { data: packages } = await supabase
          .from("package_bundles")
          .select("supplier")
          .not("supplier", "is", null);

        packages?.forEach((pkg: any) => {
          const supplierName = pkg.supplier;
          if (supplierName) {
            if (!supplierCounts[supplierName]) {
              supplierCounts[supplierName] = { name: supplierName, count: 0 };
            }
            supplierCounts[supplierName].count += 1;
          }
        });

        // Find supplier with highest count
        const sortedSuppliers = Object.values(supplierCounts).sort((a, b) => b.count - a.count);
        if (sortedSuppliers.length > 0) {
          topSupplier = sortedSuppliers[0].name;
        } else if (suppliers.length > 0) {
          // Fallback to first active supplier if no products found
          topSupplier = suppliers[0].supplier_name;
        }
      }
    } catch (error) {
      console.error("Error fetching top supplier:", error);
    }

    return NextResponse.json({
      data: {
        total_suppliers: suppliersCount || 0,
        total_products: totalProducts,
        borrowed: borrowedCount || 0,
        used_in_projects: usedInProjectsCount || 0,
        top_supplier: topSupplier || "N/A",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard statistics";
    console.error("Error fetching dashboard statistics:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

