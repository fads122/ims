import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch activity logs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const entityType = searchParams.get("entity_type");
    const activityType = searchParams.get("activity_type");
    const userEmail = searchParams.get("user_email");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Apply filters
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    if (activityType) {
      query = query.eq("activity_type", activityType);
    }
    if (userEmail) {
      query = query.eq("user_email", userEmail);
    }
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      // Check if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { 
            error: "Activity logs table does not exist. Please run create-activity-logs-table.sql in your Supabase dashboard.",
            data: [],
            pagination: { page: 1, limit, total: 0, totalPages: 0 }
          },
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
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch activity logs",
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      },
      { status: 500 }
    );
  }
}

// POST - Create a new activity log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_email,
      activity_type,
      entity_type,
      entity_id,
      description,
      action_details,
      user_id,
    } = body;

    // Validate required fields
    if (!user_email || !activity_type || !entity_type || !description) {
      return NextResponse.json(
        { error: "Missing required fields: user_email, activity_type, entity_type, description" },
        { status: 400 }
      );
    }

    // Get IP address and user agent from request headers
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Validate user_id is a valid UUID format before inserting
    const isValidUUID = (str: string | undefined | null): boolean => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: isValidUUID(user_id) ? user_id : null,
        user_email,
        activity_type,
        entity_type,
        entity_id: entity_id || null,
        description,
        action_details: action_details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create activity log" },
      { status: 500 }
    );
  }
}

