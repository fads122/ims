import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch clients grouped by client_name with their proposals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10000"); // Load all for client-side pagination
    const offset = (page - 1) * limit;

    // Fetch all proposals (excluding deleted ones)
    const { data: proposals, error: proposalsError } = await supabase
      .from("project_proposals")
      .select("id, proposal_number, title, client_name, client_email, client_phone, client_address, total_amount, subtotal, tax_amount, status, proposal_date, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (proposalsError) throw proposalsError;

    // Group proposals by client_name
    const clientsMap = new Map<string, {
      client_name: string;
      client_email: string | null;
      client_phone: string | null;
      client_address: string | null;
      proposals: typeof proposals;
    }>();

    proposals?.forEach((proposal) => {
      if (!proposal.client_name) return; // Skip proposals without client name

      const clientName = proposal.client_name.trim();
      
      if (!clientsMap.has(clientName)) {
        clientsMap.set(clientName, {
          client_name: clientName,
          client_email: proposal.client_email || null,
          client_phone: proposal.client_phone || null,
          client_address: proposal.client_address || null,
          proposals: [],
        });
      }

      const client = clientsMap.get(clientName);
      if (client) {
        client.proposals.push(proposal);
      }
    });

    // Convert map to array
    const clients = Array.from(clientsMap.values());

    // Apply pagination
    const paginatedClients = clients.slice(offset, offset + limit);
    const total = clients.length;

    return NextResponse.json({
      data: paginatedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

