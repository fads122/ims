/**
 * Server-side Activity Logger
 * For use in API routes and server components
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ActivityLogData {
  user_email: string;
  activity_type: "create" | "update" | "delete" | "view" | "export" | "import" | "login" | "logout" | "other";
  entity_type: string;
  entity_id?: string;
  description: string;
  action_details?: Record<string, unknown>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an activity on the server side
 */
export async function logActivityServer(data: ActivityLogData): Promise<void> {
  try {
    await supabase.from("activity_logs").insert({
      user_id: data.user_id || null,
      user_email: data.user_email,
      activity_type: data.activity_type,
      entity_type: data.entity_type,
      entity_id: data.entity_id || null,
      description: data.description,
      action_details: data.action_details || {},
      ip_address: data.ip_address || "unknown",
      user_agent: data.user_agent || "unknown",
    });
  } catch (error) {
    console.error("Error logging activity on server:", error);
    // Don't throw - activity logging should not break the main flow
  }
}

