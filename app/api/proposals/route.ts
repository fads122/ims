import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logActivityServer } from "@/lib/server-activity-logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for stock management
// Helper function to get equipment type and current quantity
async function getEquipmentInfo(equipmentId: string) {
  // Check operational_equipment
  const { data: operational } = await supabase
    .from("operational_equipment")
    .select("id, quantity")
    .eq("id", equipmentId)
    .single();

  if (operational) {
    return { type: "operational", quantity: operational.quantity, table: "operational_equipment" };
  }

  // Check for_sale_products
  const { data: forSale } = await supabase
    .from("for_sale_products")
    .select("id, quantity")
    .eq("id", equipmentId)
    .single();

  if (forSale) {
    return { type: "for-sale", quantity: forSale.quantity, table: "for_sale_products" };
  }

  // Check package_bundles
  const { data: packageBundle } = await supabase
    .from("package_bundles")
    .select("id, quantity")
    .eq("id", equipmentId)
    .single();

  if (packageBundle) {
    return { type: "package", quantity: packageBundle.quantity, table: "package_bundles" };
  }

  return null;
}

// Helper function to decrease equipment stock
async function decreaseEquipmentStock(equipmentId: string, quantity: number) {
  const equipmentInfo = await getEquipmentInfo(equipmentId);
  if (!equipmentInfo) {
    throw new Error(`Equipment with ID ${equipmentId} not found`);
  }

  if (equipmentInfo.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${equipmentInfo.quantity}, Requested: ${quantity}`);
  }

  const newQuantity = Math.max(0, equipmentInfo.quantity - quantity);

  const { error } = await supabase
    .from(equipmentInfo.table)
    .update({ quantity: newQuantity })
    .eq("id", equipmentId);

  if (error) throw error;
  return { success: true, newQuantity };
}

// Helper function to restore equipment stock
async function restoreEquipmentStock(equipmentId: string, quantity: number) {
  const equipmentInfo = await getEquipmentInfo(equipmentId);
  if (!equipmentInfo) {
    console.warn(`Equipment with ID ${equipmentId} not found, skipping stock restoration`);
    return;
  }

  const newQuantity = equipmentInfo.quantity + quantity;

  const { error } = await supabase
    .from(equipmentInfo.table)
    .update({ quantity: newQuantity })
    .eq("id", equipmentId);

  if (error) {
    console.error(`Error restoring stock for equipment ${equipmentId}:`, error);
    throw error;
  }
}

// GET - Fetch proposals with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // If ID is provided, return single proposal with items
    if (id) {
      const { data: proposal, error: proposalError } = await supabase
        .from("project_proposals")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (proposalError) throw proposalError;

      const { data: items, error: itemsError } = await supabase
        .from("proposal_items")
        .select("*")
        .eq("proposal_id", id)
        .order("display_order", { ascending: true });

      if (itemsError) throw itemsError;

      return NextResponse.json({
        data: { ...proposal, items: items || [] },
      });
    }

    // Build query for list
    let query = supabase
      .from("project_proposals")
      .select("*", { count: "exact" })
      .is("deleted_at", null);

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `proposal_number.ilike.%${search}%,title.ilike.%${search}%,client_name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      if (error.code === "PGRST116" || error.message.includes("relation") || error.message.includes("does not exist")) {
        return NextResponse.json(
          { error: "Project proposals table does not exist. Please run the SQL schema to create it." },
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
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

// POST - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposal, items } = body;

    if (!proposal || !proposal.title || !proposal.proposal_date) {
      return NextResponse.json(
        { error: "Missing required fields: title and proposal_date are required" },
        { status: 400 }
      );
    }

    // Generate proposal number if not provided
    let proposalNumber = proposal.proposal_number;
    if (!proposalNumber) {
      const { data: latestProposal } = await supabase
        .from("project_proposals")
        .select("proposal_number")
        .like("proposal_number", "PROP-%")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let counter = 1;
      if (latestProposal?.proposal_number) {
        const match = latestProposal.proposal_number.match(/PROP-(\d+)/);
        if (match) {
          counter = parseInt(match[1], 10) + 1;
        }
      }
      proposalNumber = `PROP-${counter.toString().padStart(6, "0")}`;
    }

    // Calculate totals
    const subtotal = proposal.subtotal || 0;
    const discountAmount = proposal.discount_amount || 0;
    const discountPercentage = proposal.discount_percentage || 0;
    const taxPercentage = proposal.tax_percentage || 12;
    const taxAmount = ((subtotal - discountAmount) * taxPercentage) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Prepare proposal data
    const proposalData: any = {
      proposal_number: proposalNumber,
      title: proposal.title,
      description: proposal.description || null,
      client_id: proposal.client_id || null,
      client_name: proposal.client_name || null,
      client_email: proposal.client_email || null,
      client_phone: proposal.client_phone || null,
      client_address: proposal.client_address || null,
      project_id: proposal.project_id || null,
      proposal_date: proposal.proposal_date,
      valid_until: proposal.valid_until || null,
      status: proposal.status || "draft",
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      tax_amount: taxAmount,
      tax_percentage: taxPercentage,
      total_amount: totalAmount,
      currency: proposal.currency || "PHP",
      payment_terms: proposal.payment_terms || null,
      delivery_terms: proposal.delivery_terms || null,
      notes: proposal.notes || null,
      terms_and_conditions: proposal.terms_and_conditions || null,
      created_by: proposal.created_by || null,
      attachments: proposal.attachments || [],
    };

    // Insert proposal
    const { data: insertedProposal, error: proposalError } = await supabase
      .from("project_proposals")
      .insert(proposalData)
      .select()
      .single();

    if (proposalError) throw proposalError;

    // Insert proposal items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsData = items.map((item: any, index: number) => ({
        proposal_id: insertedProposal.id,
        equipment_id: item.equipment_id || null,
        item_name: item.item_name,
        item_description: item.item_description || null,
        brand: item.brand || null,
        model: item.model || null,
        category: item.category || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        discount_amount: item.discount_amount || 0,
        discount_percentage: item.discount_percentage || 0,
        line_total: item.line_total || item.actual_cost || item.unit_price * (item.quantity || 1),
        display_order: index,
        supplier: item.supplier || null,
        warranty_period: item.warranty_period || null,
        delivery_time: item.delivery_time || null,
        profit_margin: item.profit_margin || 20,
        actual_cost: item.actual_cost || null,
        status: item.status || "approved",
        available_stock: item.available_stock || null,
        brochure_url: item.brochure_url || null,
      }));

      const { error: itemsError } = await supabase
        .from("proposal_items")
        .insert(itemsData);

      if (itemsError) throw itemsError;

      // Decrease stock for approved items with equipment_id
      for (const item of items) {
        if (item.equipment_id && item.status === "approved" && item.quantity > 0) {
          try {
            await decreaseEquipmentStock(item.equipment_id, item.quantity);
          } catch (error: any) {
            console.error(`Error decreasing stock for equipment ${item.equipment_id}:`, error);
            // Rollback proposal creation if stock update fails
            await supabase.from("project_proposals").delete().eq("id", insertedProposal.id);
            throw new Error(`Failed to reserve stock: ${error.message}`);
          }
        }
      }
    }

    // Fetch complete proposal with items
    const { data: completeProposal, error: fetchError } = await supabase
      .from("project_proposals")
      .select(`
        *,
        proposal_items (*)
      `)
      .eq("id", insertedProposal.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      { data: completeProposal },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create proposal" },
      { status: 500 }
    );
  }
}

// PUT - Update proposal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, proposal, items } = body;

    if (!id || !proposal) {
      return NextResponse.json(
        { error: "Missing required fields: id and proposal are required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = proposal.subtotal || 0;
    const discountAmount = proposal.discount_amount || 0;
    const discountPercentage = proposal.discount_percentage || 0;
    const taxPercentage = proposal.tax_percentage || 12;
    const taxAmount = ((subtotal - discountAmount) * taxPercentage) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Prepare update data
    const updateData: any = {
      title: proposal.title,
      description: proposal.description || null,
      client_id: proposal.client_id || null,
      client_name: proposal.client_name || null,
      client_email: proposal.client_email || null,
      client_phone: proposal.client_phone || null,
      client_address: proposal.client_address || null,
      project_id: proposal.project_id || null,
      proposal_date: proposal.proposal_date,
      valid_until: proposal.valid_until || null,
      status: proposal.status || "draft",
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      tax_amount: taxAmount,
      tax_percentage: taxPercentage,
      total_amount: totalAmount,
      currency: proposal.currency || "PHP",
      payment_terms: proposal.payment_terms || null,
      delivery_terms: proposal.delivery_terms || null,
      notes: proposal.notes || null,
      terms_and_conditions: proposal.terms_and_conditions || null,
      attachments: proposal.attachments || [],
    };

    // Update status timestamps
    if (proposal.status === "sent" && !proposal.sent_at) {
      updateData.sent_at = new Date().toISOString();
    }
    if (proposal.status === "approved" && !proposal.approved_at) {
      updateData.approved_at = new Date().toISOString();
    }
    if (proposal.status === "rejected" && !proposal.rejected_at) {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = proposal.rejection_reason || null;
    }

    // Get current proposal status before update
    const { data: currentProposal } = await supabase
      .from("project_proposals")
      .select("status, client_name, client_email, client_phone, client_address, title")
      .eq("id", id)
      .single();

    // Update proposal
    const { error: proposalError } = await supabase
      .from("project_proposals")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null);

    if (proposalError) throw proposalError;

    // Auto-create delivery receipt if status changed to "delivering" or "delivered"
    if ((proposal.status === "delivering" || proposal.status === "delivered") && 
        currentProposal?.status !== "delivering" && currentProposal?.status !== "delivered") {
      try {
        // Check if delivery receipt already exists
        const { data: existingReceipt } = await supabase
          .from("delivery_receipts")
          .select("id")
          .eq("proposal_id", id)
          .is("deleted_at", null)
          .single();

        if (!existingReceipt) {
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 7); // Default to 7 days from now

          await supabase.from("delivery_receipts").insert({
            proposal_id: id,
            project_name: currentProposal.title || proposal.title || "Unknown Project",
            client_name: proposal.client_name || currentProposal.client_name || "Unknown Client",
            client_email: proposal.client_email || currentProposal.client_email || null,
            client_phone: proposal.client_phone || currentProposal.client_phone || null,
            client_address: proposal.client_address || currentProposal.client_address || null,
            delivery_date: deliveryDate.toISOString().split("T")[0],
            status: proposal.status === "delivered" ? "Delivered" : "Delivering",
          });
        } else if (proposal.status === "delivered") {
          // Update existing receipt to Delivered
          await supabase
            .from("delivery_receipts")
            .update({ status: "Delivered" })
            .eq("proposal_id", id)
            .is("deleted_at", null);
        }
      } catch (error) {
        console.error("Error auto-creating/updating delivery receipt:", error);
        // Don't throw - delivery receipt creation failure shouldn't break proposal update
      }
    }

    // Update items if provided
    if (items !== undefined) {
      // Get existing items to restore stock
      const { data: existingItems } = await supabase
        .from("proposal_items")
        .select("equipment_id, quantity, status")
        .eq("proposal_id", id);

      // Restore stock for existing approved items
      if (existingItems && existingItems.length > 0) {
        for (const item of existingItems) {
          if (item.equipment_id && item.status === "approved" && item.quantity > 0) {
            try {
              await restoreEquipmentStock(item.equipment_id, item.quantity);
            } catch (error: any) {
              console.error(`Error restoring stock for equipment ${item.equipment_id}:`, error);
              // Continue even if restoration fails for some items
            }
          }
        }
      }

      // Delete existing items
      await supabase.from("proposal_items").delete().eq("proposal_id", id);

      // Insert new items
      if (Array.isArray(items) && items.length > 0) {
        const itemsData = items.map((item: any, index: number) => ({
          proposal_id: id,
          equipment_id: item.equipment_id || null,
          item_name: item.item_name,
          item_description: item.item_description || null,
          brand: item.brand || null,
          model: item.model || null,
          category: item.category || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_amount: item.discount_amount || 0,
          discount_percentage: item.discount_percentage || 0,
          line_total: item.line_total || item.actual_cost || item.unit_price * (item.quantity || 1),
          display_order: index,
          supplier: item.supplier || null,
          warranty_period: item.warranty_period || null,
          delivery_time: item.delivery_time || null,
          profit_margin: item.profit_margin || 20,
          actual_cost: item.actual_cost || null,
          status: item.status || "approved",
          available_stock: item.available_stock || null,
          brochure_url: item.brochure_url || null,
        }));

        const { error: itemsError } = await supabase
          .from("proposal_items")
          .insert(itemsData);

        if (itemsError) throw itemsError;

        // Decrease stock for new approved items with equipment_id
        for (const item of items) {
          if (item.equipment_id && item.status === "approved" && item.quantity > 0) {
            try {
              await decreaseEquipmentStock(item.equipment_id, item.quantity);
            } catch (error: any) {
              console.error(`Error decreasing stock for equipment ${item.equipment_id}:`, error);
              // Restore already decreased stocks
              for (const processedItem of items) {
                if (
                  processedItem.equipment_id &&
                  processedItem.status === "approved" &&
                  processedItem.quantity > 0 &&
                  processedItem.equipment_id !== item.equipment_id
                ) {
                  try {
                    await restoreEquipmentStock(processedItem.equipment_id, processedItem.quantity);
                  } catch (restoreError) {
                    console.error(`Error restoring stock during rollback:`, restoreError);
                  }
                }
              }
              throw new Error(`Failed to reserve stock: ${error.message}`);
            }
          }
        }
      }
    }

    // Fetch updated proposal with items
    const { data: updatedProposal, error: fetchError } = await supabase
      .from("project_proposals")
      .select(`
        *,
        proposal_items (*)
      `)
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      { data: updatedProposal },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update proposal" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete proposal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    // Get proposal items to restore stock
    const { data: items } = await supabase
      .from("proposal_items")
      .select("equipment_id, quantity, status")
      .eq("proposal_id", id);

    // Restore stock for approved items
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.equipment_id && item.status === "approved" && item.quantity > 0) {
          try {
            await restoreEquipmentStock(item.equipment_id, item.quantity);
          } catch (error: any) {
            console.error(`Error restoring stock for equipment ${item.equipment_id}:`, error);
            // Continue even if restoration fails for some items
          }
        }
      }
    }

    const { error } = await supabase
      .from("project_proposals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) throw error;

    return NextResponse.json(
      { message: "Proposal deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete proposal" },
      { status: 500 }
    );
  }
}

