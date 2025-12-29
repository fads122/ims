/**
 * Activity Logger Utility
 * Provides functions to log system activities
 */

interface ActivityLogData {
  user_email: string;
  activity_type: "create" | "update" | "delete" | "view" | "export" | "import" | "login" | "logout" | "other";
  entity_type: string;
  entity_id?: string;
  description: string;
  action_details?: Record<string, unknown>;
  user_id?: string;
}

/**
 * Log an activity to the system
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const response = await fetch("/api/activity-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging should not break the main flow
  }
}

/**
 * Helper function to get current user from localStorage
 */
export function getCurrentUser(): { email: string; id?: string } | null {
  if (typeof window === "undefined") return null;
  
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error getting current user:", error);
  }
  
  return null;
}

/**
 * Log equipment activity
 */
export async function logEquipmentActivity(
  activityType: ActivityLogData["activity_type"],
  equipmentId: string,
  equipmentName: string,
  equipmentType: "operational" | "for-sale" | "package",
  details?: Record<string, unknown>
): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  await logActivity({
    user_email: user.email,
    user_id: user.id,
    activity_type: activityType,
    entity_type: `equipment-${equipmentType}`,
    entity_id: equipmentId,
    description: `${activityType === "create" ? "Created" : activityType === "update" ? "Updated" : activityType === "delete" ? "Deleted" : "Viewed"} ${equipmentType} equipment: ${equipmentName}`,
    action_details: {
      equipment_name: equipmentName,
      equipment_type: equipmentType,
      ...details,
    },
  });
}

/**
 * Log proposal activity
 */
export async function logProposalActivity(
  activityType: ActivityLogData["activity_type"],
  proposalId: string,
  proposalNumber: string,
  proposalTitle: string,
  details?: Record<string, unknown>
): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  await logActivity({
    user_email: user.email,
    user_id: user.id,
    activity_type: activityType,
    entity_type: "proposal",
    entity_id: proposalId,
    description: `${activityType === "create" ? "Created" : activityType === "update" ? "Updated" : activityType === "delete" ? "Deleted" : activityType === "export" ? "Exported" : "Viewed"} proposal: ${proposalNumber} - ${proposalTitle}`,
    action_details: {
      proposal_number: proposalNumber,
      proposal_title: proposalTitle,
      ...details,
    },
  });
}

/**
 * Log client activity
 */
export async function logClientActivity(
  activityType: ActivityLogData["activity_type"],
  clientName: string,
  details?: Record<string, unknown>
): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  await logActivity({
    user_email: user.email,
    user_id: user.id,
    activity_type: activityType,
    entity_type: "client",
    description: `${activityType === "view" ? "Viewed" : "Accessed"} client: ${clientName}`,
    action_details: {
      client_name: clientName,
      ...details,
    },
  });
}

/**
 * Log user authentication activity
 */
export async function logAuthActivity(
  activityType: "login" | "logout",
  email: string
): Promise<void> {
  await logActivity({
    user_email: email,
    activity_type: activityType,
    entity_type: "auth",
    description: `${activityType === "login" ? "Logged in" : "Logged out"}`,
    action_details: {
      email,
    },
  });
}

/**
 * Log generic activity
 */
export async function logGenericActivity(
  activityType: ActivityLogData["activity_type"],
  entityType: string,
  description: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  await logActivity({
    user_email: user.email,
    user_id: user.id,
    activity_type: activityType,
    entity_type: entityType,
    entity_id: entityId,
    description,
    action_details: details,
  });
}

