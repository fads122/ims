import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // If ID is provided, return single supplier
    if (id) {
      const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
      if (error) {
        // If table doesn't exist, return helpful error
        if (error.code === "PGRST116" || error.message.includes("relation") || error.message.includes("does not exist")) {
          return NextResponse.json(
            { error: "Suppliers table does not exist. Please run the SQL schema to create it." },
            { status: 404 }
          );
        }
        throw error;
      }
      return NextResponse.json({ data });
    }

    let query = supabase.from("suppliers").select("*", { count: "exact" });

    if (search) {
      query = query.or(`supplier_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // If table doesn't exist, return helpful error
      if (error.code === "PGRST116" || error.message.includes("relation") || error.message.includes("does not exist")) {
        return NextResponse.json(
          { error: "Suppliers table does not exist. Please run the SQL schema to create it." },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch suppliers. Please check your Supabase configuration." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierName, contactPerson, phone, email, status, address, facebookPage, viber, telegram, instagram } = body;

    // Validate required fields
    if (!supplierName || !contactPerson || !phone || !email || !address) {
      return NextResponse.json(
        { error: "Missing required fields: supplierName, contactPerson, phone, email, and address are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        supplier_name: supplierName,
        contact_person: contactPerson,
        phone: phone,
        email: email,
        status: status || "Active",
        address: address,
        facebook_page: facebookPage || null,
        viber: viber || null,
        telegram: telegram || null,
        instagram: instagram || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, supplierName, contactPerson, phone, email, status, address, facebookPage, viber, telegram, instagram, rating } = body;

    if (!id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("suppliers")
      .update({
        supplier_name: supplierName,
        contact_person: contactPerson,
        phone: phone,
        email: email,
        status: status,
        address: address,
        facebook_page: facebookPage || null,
        viber: viber || null,
        telegram: telegram || null,
        instagram: instagram || null,
        rating: rating || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("suppliers").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

