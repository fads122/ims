import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logActivityServer } from "@/lib/server-activity-logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to validate UUID
const isValidUUID = (str: string | undefined | null): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to get equipment info and decrease stock
async function getEquipmentInfo(equipmentId: string, equipmentType: string) {
  if (equipmentType === "operational") {
    const { data } = await supabase
      .from("operational_equipment")
      .select("id, name, brand, model, quantity, images")
      .eq("id", equipmentId)
      .single();
    return data;
  } else if (equipmentType === "for-sale") {
    const { data } = await supabase
      .from("for_sale_products")
      .select("id, product_model, product_brand, quantity, images")
      .eq("id", equipmentId)
      .single();
    return data;
  } else if (equipmentType === "package") {
    const { data } = await supabase
      .from("package_bundles")
      .select("id, package_name, quantity, images")
      .eq("id", equipmentId)
      .single();
    return data;
  }
  return null;
}

async function decreaseEquipmentStock(equipmentId: string, equipmentType: string, quantity: number) {
  if (equipmentType === "operational") {
    const { error } = await supabase.rpc("decrement_quantity", {
      table_name: "operational_equipment",
      row_id: equipmentId,
      amount: quantity,
    });
    if (error) {
      // Fallback to direct update
      const { data: current } = await supabase
        .from("operational_equipment")
        .select("quantity")
        .eq("id", equipmentId)
        .single();
      if (current && current.quantity >= quantity) {
        await supabase
          .from("operational_equipment")
          .update({ quantity: current.quantity - quantity })
          .eq("id", equipmentId);
      } else {
        throw new Error("Insufficient stock");
      }
    }
  } else if (equipmentType === "for-sale") {
    const { data: current } = await supabase
      .from("for_sale_products")
      .select("quantity")
      .eq("id", equipmentId)
      .single();
    if (current && current.quantity >= quantity) {
      await supabase
        .from("for_sale_products")
        .update({ quantity: current.quantity - quantity })
        .eq("id", equipmentId);
    } else {
      throw new Error("Insufficient stock");
    }
  } else if (equipmentType === "package") {
    const { data: current } = await supabase
      .from("package_bundles")
      .select("quantity")
      .eq("id", equipmentId)
      .single();
    if (current && current.quantity >= quantity) {
      await supabase
        .from("package_bundles")
        .update({ quantity: current.quantity - quantity })
        .eq("id", equipmentId);
    } else {
      throw new Error("Insufficient stock");
    }
  }
}

async function increaseEquipmentStock(equipmentId: string, equipmentType: string, quantity: number) {
  if (equipmentType === "operational") {
    const { data: current } = await supabase
      .from("operational_equipment")
      .select("quantity")
      .eq("id", equipmentId)
      .single();
    if (current) {
      await supabase
        .from("operational_equipment")
        .update({ quantity: (current.quantity || 0) + quantity })
        .eq("id", equipmentId);
    }
  } else if (equipmentType === "for-sale") {
    const { data: current } = await supabase
      .from("for_sale_products")
      .select("quantity")
      .eq("id", equipmentId)
      .single();
    if (current) {
      await supabase
        .from("for_sale_products")
        .update({ quantity: (current.quantity || 0) + quantity })
        .eq("id", equipmentId);
    }
  } else if (equipmentType === "package") {
    const { data: current } = await supabase
      .from("package_bundles")
      .select("quantity")
      .eq("id", equipmentId)
      .single();
    if (current) {
      await supabase
        .from("package_bundles")
        .update({ quantity: (current.quantity || 0) + quantity })
        .eq("id", equipmentId);
    }
  }
}

// GET - Fetch all borrow requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");
    const userId = searchParams.get("user_id");

    let query = supabase
      .from("borrow_requests")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: requests, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          {
            error: "Borrow requests table does not exist. Please run create-borrow-requests-tables.sql in your Supabase dashboard.",
            data: [],
            pagination: { page: 1, limit, total: 0, totalPages: 0 },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // Fetch equipment details for each request
    const requestsWithEquipment = await Promise.all(
      (requests || []).map(async (request) => {
        const { data: equipmentItems } = await supabase
          .from("borrow_request_equipment")
          .select("*")
          .eq("borrow_request_id", request.id)
          .is("deleted_at", null);

        const equipmentList = await Promise.all(
          (equipmentItems || []).map(async (item) => {
            const equipmentInfo = await getEquipmentInfo(item.equipment_id, item.equipment_type);
            return {
              ...item,
              equipment_details: equipmentInfo,
            };
          })
        );

        return {
          ...request,
          equipmentList: equipmentList || [],
        };
      })
    );

    return NextResponse.json({
      data: requestsWithEquipment,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch borrow requests";
    console.error("Error fetching borrow requests:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Create a new borrow request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      borrower_name,
      borrower_department,
      borrower_contact,
      borrower_email,
      borrow_date,
      return_date,
      purpose,
      equipment_items,
    } = body;

    // Validate required fields
    if (!borrower_name || !borrow_date || !return_date || !equipment_items || equipment_items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: borrower_name, borrow_date, return_date, and equipment_items are required" },
        { status: 400 }
      );
    }

    // Create borrow request
    const { data: borrowRequest, error: requestError } = await supabase
      .from("borrow_requests")
      .insert({
        user_id: isValidUUID(user_id) ? user_id : null,
        borrower_name,
        borrower_department: borrower_department || null,
        borrower_contact: borrower_contact || null,
        borrower_email: borrower_email || null,
        borrow_date,
        return_date,
        purpose: purpose || null,
        status: "borrowed",
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Insert equipment items
    const equipmentData = equipment_items.map((item: { equipment_id: string; equipment_type: string; quantity: number }) => ({
      borrow_request_id: borrowRequest.id,
      equipment_id: item.equipment_id,
      equipment_type: item.equipment_type,
      quantity: item.quantity || 1,
    }));

    const { error: equipmentError } = await supabase
      .from("borrow_request_equipment")
      .insert(equipmentData);

    if (equipmentError) throw equipmentError;

    // Validate stock availability before decreasing
    for (const item of equipment_items) {
      const equipmentInfo = await getEquipmentInfo(item.equipment_id, item.equipment_type);
      const requestedQuantity = item.quantity || 1;
      const availableStock = equipmentInfo?.quantity || 0;

      if (requestedQuantity > availableStock) {
        // Rollback borrow request
        await supabase.from("borrow_requests").delete().eq("id", borrowRequest.id);
        throw new Error(
          `Insufficient stock for equipment. Available: ${availableStock}, Requested: ${requestedQuantity}`
        );
      }
    }

    // Decrease equipment stock and create movements
    for (const item of equipment_items) {
      try {
        await decreaseEquipmentStock(item.equipment_id, item.equipment_type, item.quantity || 1);

        // Create movement record
        await supabase.from("equipment_movements").insert({
          equipment_id: item.equipment_id,
          equipment_type: item.equipment_type,
          movement_type: "borrowed",
          borrow_request_id: borrowRequest.id,
          employee_id: isValidUUID(user_id) ? user_id : null,
          status: "active",
        });
      } catch (stockError: unknown) {
        const errorMsg = stockError instanceof Error ? stockError.message : "Failed to update stock";
        console.error(`Error updating stock for equipment ${item.equipment_id}:`, stockError);
        // Rollback borrow request
        await supabase.from("borrow_requests").delete().eq("id", borrowRequest.id);
        throw new Error(`Failed to reserve stock: ${errorMsg}`);
      }
    }

    // Log activity
    await logActivityServer({
      user_email: borrower_email || "system",
      activity_type: "create",
      entity_type: "borrow_request",
      entity_id: borrowRequest.id,
      description: `Created borrow request for ${borrower_name}`,
    });

    // Fetch complete request with equipment
    const { data: completeRequest } = await supabase
      .from("borrow_requests")
      .select("*")
      .eq("id", borrowRequest.id)
      .single();

    const { data: equipmentItems } = await supabase
      .from("borrow_request_equipment")
      .select("*")
      .eq("borrow_request_id", borrowRequest.id)
      .is("deleted_at", null);

    const equipmentList = await Promise.all(
      (equipmentItems || []).map(async (item) => {
        const equipmentInfo = await getEquipmentInfo(item.equipment_id, item.equipment_type);
        return {
          ...item,
          equipment_details: equipmentInfo,
        };
      })
    );

    return NextResponse.json(
      {
        data: {
          ...completeRequest,
          equipmentList: equipmentList || [],
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create borrow request";
    console.error("Error creating borrow request:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT - Update borrow request (mainly for returning equipment)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, actual_return_date } = body;

    if (!id) {
      return NextResponse.json({ error: "Borrow request ID is required" }, { status: 400 });
    }

    // Get current request
    const { data: currentRequest, error: fetchError } = await supabase
      .from("borrow_requests")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json({ error: "Borrow request not found" }, { status: 404 });
    }

    // If returning equipment
    if (status === "Returned" || status === "returned") {
      // Get borrowed equipment
      const { data: equipmentItems } = await supabase
        .from("borrow_request_equipment")
        .select("*")
        .eq("borrow_request_id", id)
        .is("deleted_at", null);

      // Restore equipment stock and create return movements
      for (const item of equipmentItems || []) {
        try {
          await increaseEquipmentStock(item.equipment_id, item.equipment_type, item.quantity);

          // Create return movement record
          await supabase.from("equipment_movements").insert({
            equipment_id: item.equipment_id,
            equipment_type: item.equipment_type,
            movement_type: "returned",
            borrow_request_id: id,
            employee_id: isValidUUID(currentRequest.user_id) ? currentRequest.user_id : null,
            status: "returned",
          });

          // Update existing borrow movements to returned
          await supabase
            .from("equipment_movements")
            .update({ status: "returned" })
            .eq("borrow_request_id", id)
            .eq("movement_type", "borrowed");
        } catch (stockError: unknown) {
          console.error(`Error restoring stock for equipment ${item.equipment_id}:`, stockError);
          // Continue even if stock update fails
        }
      }

      // Log activity
      await logActivityServer({
        user_email: currentRequest.borrower_email || "system",
        activity_type: "update",
        entity_type: "borrow_request",
        entity_id: id,
        description: `Returned borrow request for ${currentRequest.borrower_name}`,
      });
    }

    // Update borrow request
    const { data: updatedRequest, error: updateError } = await supabase
      .from("borrow_requests")
      .update({
        status: status || currentRequest.status,
        actual_return_date: actual_return_date || (status === "Returned" || status === "returned" ? new Date().toISOString() : currentRequest.actual_return_date),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: updatedRequest }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update borrow request";
    console.error("Error updating borrow request:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Soft delete borrow request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Borrow request ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("borrow_requests")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete borrow request";
    console.error("Error deleting borrow request:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

