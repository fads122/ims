import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch saved equipment entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    let query = supabase
      .from("saved_equipment")
      .select("*")
      .order("timestamp", { ascending: false });

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json({ data: [] }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching saved equipment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new saved equipment entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, items, user_id } = body;

    if (!title || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Title and items array are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_equipment")
      .insert({
        title,
        timestamp: new Date().toISOString(),
        items: items,
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return helpful error
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "saved_equipment table does not exist. Please run the SQL script to create it.",
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating saved equipment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a saved equipment entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("saved_equipment").delete().eq("id", id);

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "saved_equipment table does not exist. Please run the SQL script to create it.",
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting saved equipment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

