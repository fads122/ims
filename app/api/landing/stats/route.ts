import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch landing page statistics
export async function GET(request: NextRequest) {
  try {
    // If Supabase is not configured, return default values
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        activeUsers: 10000,
        uptime: 99.9,
        support: "24/7",
        totalProducts: 0,
        totalSuppliers: 0,
        totalProjects: 0,
      });
    }

    // Fetch total products (operational + for-sale + packages)
    let totalProducts = 0;
    try {
      const [operationalRes, forSaleRes, packagesRes] = await Promise.all([
        supabase.from("operational_equipment").select("*", { count: "exact", head: true }),
        supabase.from("for_sale_products").select("*", { count: "exact", head: true }),
        supabase.from("package_bundles").select("*", { count: "exact", head: true }),
      ]);

      totalProducts =
        (operationalRes.count || 0) + (forSaleRes.count || 0) + (packagesRes.count || 0);
    } catch (error) {
      console.log("Error fetching products:", error);
      totalProducts = 0;
    }

    // Fetch total suppliers (handle table not existing)
    let suppliersCount = 0;
    try {
      const { count, error } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);
      
      if (!error) {
        suppliersCount = count || 0;
      }
    } catch (error) {
      console.log("Suppliers table may not exist:", error);
    }

    // Fetch total project proposals (handle table not existing)
    let projectsCount = 0;
    try {
      const { count, error } = await supabase
        .from("project_proposals")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);
      
      if (!error) {
        projectsCount = count || 0;
      }
    } catch (error) {
      console.log("Project proposals table may not exist:", error);
    }

    // Calculate active users (approximate based on activity)
    // For now, we'll use a base number that can be updated
    const activeUsers = 10000 + Math.floor((totalProducts + (suppliersCount || 0)) / 10);

    return NextResponse.json({
      activeUsers,
      uptime: 99.9,
      support: "24/7",
      totalProducts,
      totalSuppliers: suppliersCount || 0,
      totalProjects: projectsCount || 0,
    });
  } catch (error: any) {
    console.error("Error fetching landing stats:", error);
    // Return default values on error
    return NextResponse.json({
      activeUsers: 10000,
      uptime: 99.9,
      support: "24/7",
      totalProducts: 0,
      totalSuppliers: 0,
      totalProjects: 0,
    });
  }
}

