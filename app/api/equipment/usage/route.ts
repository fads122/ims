import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch equipment usage (projects and borrow requests)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get("equipment_id");
    const equipmentType = searchParams.get("equipment_type");

    if (!equipmentId || !equipmentType) {
      return NextResponse.json(
        { error: "equipment_id and equipment_type are required" },
        { status: 400 }
      );
    }

    // Fetch equipment used in proposals
    const { data: proposalItems, error: proposalError } = await supabase
      .from("proposal_items")
      .select(`
        id,
        quantity,
        status,
        proposal_id
      `)
      .eq("equipment_id", equipmentId)
      .not("proposal_id", "is", null);

    // Fetch proposal details separately
    let proposalUsage: any[] = [];
    if (proposalItems && proposalItems.length > 0) {
      const proposalIds = [...new Set(proposalItems.map((item: any) => item.proposal_id))];
      const { data: proposals } = await supabase
        .from("project_proposals")
        .select("id, proposal_number, title, client_name, status")
        .in("id", proposalIds)
        .is("deleted_at", null);

      proposalUsage = (proposalItems || []).map((item: any) => {
        const proposal = proposals?.find((p: any) => p.id === item.proposal_id);
        return {
          ...item,
          project_proposals: proposal || null,
        };
      });
    }

    if (proposalError && !proposalError.message?.includes("does not exist")) {
      console.error("Error fetching proposal items:", proposalError);
    }

    // Fetch equipment borrowed
    const { data: borrowItems, error: borrowError } = await supabase
      .from("borrow_request_equipment")
      .select(`
        id,
        quantity,
        borrow_request_id
      `)
      .eq("equipment_id", equipmentId)
      .eq("equipment_type", equipmentType)
      .is("deleted_at", null);

    // Fetch borrow request details separately
    let borrowUsage: any[] = [];
    if (borrowItems && borrowItems.length > 0) {
      const borrowRequestIds = [...new Set(borrowItems.map((item: any) => item.borrow_request_id))];
      const { data: borrowRequests } = await supabase
        .from("borrow_requests")
        .select("id, borrower_name, borrower_department, borrow_date, return_date, status")
        .in("id", borrowRequestIds)
        .is("deleted_at", null);

      borrowUsage = (borrowItems || []).map((item: any) => {
        const request = borrowRequests?.find((r: any) => r.id === item.borrow_request_id);
        return {
          ...item,
          borrow_requests: request || null,
        };
      });
    }

    if (borrowError && !borrowError.message?.includes("does not exist")) {
      console.error("Error fetching borrow items:", borrowError);
    }

    // Calculate totals
    const usedInProjects = proposalUsage
      .filter((item: any) => item.status === "approved")
      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    const borrowed = borrowUsage
      .filter((item: any) => {
        const request = item.borrow_requests;
        return request && request.status !== "Returned" && request.status !== "returned";
      })
      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    // Format proposal usage
    const formattedProposalUsage = proposalUsage
      .filter((item: any) => item.status === "approved" && item.project_proposals)
      .map((item: any) => ({
        id: item.id,
        proposal_id: item.proposal_id,
        quantity: item.quantity || 0,
        proposal_number: item.project_proposals?.proposal_number || "N/A",
        proposal_title: item.project_proposals?.title || "N/A",
        client_name: item.project_proposals?.client_name || "N/A",
        proposal_status: item.project_proposals?.status || "N/A",
      }));

    // Format borrow usage
    const formattedBorrowUsage = borrowUsage
      .filter((item: any) => {
        const request = item.borrow_requests;
        return request && request.status !== "Returned" && request.status !== "returned";
      })
      .map((item: any) => ({
        id: item.id,
        borrow_request_id: item.borrow_request_id,
        quantity: item.quantity || 0,
        borrower_name: item.borrow_requests?.borrower_name || "N/A",
        borrower_department: item.borrow_requests?.borrower_department || "N/A",
        borrow_date: item.borrow_requests?.borrow_date || null,
        return_date: item.borrow_requests?.return_date || null,
        borrow_status: item.borrow_requests?.status || "N/A",
      }));

    return NextResponse.json({
      data: {
        used_in_projects: usedInProjects,
        borrowed: borrowed,
        proposal_usage: formattedProposalUsage,
        borrow_usage: formattedBorrowUsage,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch equipment usage";
    console.error("Error fetching equipment usage:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

