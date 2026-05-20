import { db } from "@/lib/db";

/**
 * Log an audit trail entry.
 * Call this in API routes after any mutation (create/update/delete).
 */
export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    // Don't let audit logging failures break the main flow
    console.error("[AUDIT] Failed to log:", err);
  }
}

/** Human-readable action labels */
export const ACTION_LABELS: Record<string, string> = {
  CREATE_PLAYER: "Created player",
  UPDATE_PLAYER: "Updated player",
  DELETE_PLAYER: "Deleted player",
  CREATE_SUBSCRIPTION: "Created subscription",
  FREEZE_SUBSCRIPTION: "Froze subscription",
  UNFREEZE_SUBSCRIPTION: "Unfroze subscription",
  CANCEL_SUBSCRIPTION: "Cancelled subscription",
  EXTEND_SUBSCRIPTION: "Extended subscription",
  TRANSFER_SUBSCRIPTION: "Transferred subscription",
  CREATE_COUPON: "Created coupon",
  DEACTIVATE_COUPON: "Deactivated coupon",
  CREATE_EVALUATION: "Submitted evaluations",
  CREATE_TICKET: "Created ticket",
  REPLY_TICKET: "Replied to ticket",
  RESOLVE_TICKET: "Resolved ticket",
  CREATE_POSTPONEMENT: "Requested postponement",
  MARK_NOTIFICATIONS_READ: "Marked notifications read",
  CREATE_MERCHANDISE: "Added merchandise",
  UPDATE_MERCHANDISE: "Updated merchandise",
  SELECT_BEST_PLAYER: "Selected best player",
  GIFT_SUBSCRIPTION: "Gifted subscription",
  PROCESS_REFUND: "Processed refund",
  LOGIN: "Logged in",
};
