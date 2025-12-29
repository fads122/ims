import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logActivityServer } from "@/lib/server-activity-logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch delivery receipts with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // If ID is provided, return single receipt
    if (id) {
      const { data: receipt, error: receiptError } = await supabase
        .from("delivery_receipts")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (receiptError) throw receiptError;

      return NextResponse.json({
        data: receipt,
      });
    }

    // Build query for list
    let query = supabase
      .from("delivery_receipts")
      .select("*", { count: "exact" })
      .is("deleted_at", null);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `project_name.ilike.%${search}%,client_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order("delivery_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

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
    console.error("Error fetching delivery receipts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch delivery receipts" },
      { status: 500 }
    );
  }
}

// POST - Create new delivery receipt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      proposal_id,
      project_name,
      client_name,
      client_email,
      client_phone,
      client_address,
      delivery_date,
      status = "Delivering",
    } = body;

    // Validate required fields
    if (!project_name || !client_name || !delivery_date) {
      return NextResponse.json(
        { error: "Missing required fields: project_name, client_name, and delivery_date are required" },
        { status: 400 }
      );
    }

    const { data: insertedReceipt, error } = await supabase
      .from("delivery_receipts")
      .insert({
        proposal_id: proposal_id || null,
        project_name,
        client_name,
        client_email: client_email || null,
        client_phone: client_phone || null,
        client_address: client_address || null,
        delivery_date,
        status,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    const userEmail = request.headers.get("x-user-email") || "unknown";
    await logActivityServer({
      user_email: userEmail,
      activity_type: "create",
      entity_type: "delivery-receipt",
      entity_id: insertedReceipt.id,
      description: `Created delivery receipt for project: ${project_name}`,
      action_details: {
        project_name,
        client_name,
        status,
      },
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      { data: insertedReceipt },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating delivery receipt:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create delivery receipt" },
      { status: 500 }
    );
  }
}

// PUT - Update delivery receipt
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      received_by,
      delivered_date,
      delivered_time,
      attached_file,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Receipt ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (received_by !== undefined) updateData.received_by = received_by;
    if (delivered_date !== undefined) updateData.delivered_date = delivered_date;
    if (delivered_time !== undefined) updateData.delivered_time = delivered_time;
    if (attached_file !== undefined) updateData.attached_file = attached_file;
    if (status !== undefined) updateData.status = status;

    // Get receipt details before update for logging
    const { data: receiptBeforeUpdate } = await supabase
      .from("delivery_receipts")
      .select("project_name, proposal_id")
      .eq("id", id)
      .single();

    const { data: updatedReceipt, error } = await supabase
      .from("delivery_receipts")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw error;

    // If status changed to "Delivered", update proposal status
    if (status === "Delivered" && receiptBeforeUpdate?.proposal_id) {
      await supabase
        .from("project_proposals")
        .update({ status: "delivered" })
        .eq("id", receiptBeforeUpdate.proposal_id);
    }

    // Log activity
    const userEmail = request.headers.get("x-user-email") || "unknown";
    await logActivityServer({
      user_email: userEmail,
      activity_type: "update",
      entity_type: "delivery-receipt",
      entity_id: id,
      description: `Updated delivery receipt: ${updatedReceipt.project_name}`,
      action_details: {
        project_name: updatedReceipt.project_name,
        status: updatedReceipt.status,
        received_by: updatedReceipt.received_by,
      },
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      { data: updatedReceipt },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating delivery receipt:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update delivery receipt" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete delivery receipt
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Receipt ID is required" },
        { status: 400 }
      );
    }

    // Get receipt details before deleting for logging
    const { data: receiptToDelete } = await supabase
      .from("delivery_receipts")
      .select("project_name")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    const { error } = await supabase
      .from("delivery_receipts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) throw error;

    // Log activity
    const userEmail = request.headers.get("x-user-email") || "unknown";
    if (receiptToDelete) {
      await logActivityServer({
        user_email: userEmail,
        activity_type: "delete",
        entity_type: "delivery-receipt",
        entity_id: id,
        description: `Deleted delivery receipt: ${receiptToDelete.project_name}`,
        action_details: {
          project_name: receiptToDelete.project_name,
        },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    }

    return NextResponse.json(
      { message: "Delivery receipt deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting delivery receipt:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete delivery receipt" },
      { status: 500 }
    );
  }
}


