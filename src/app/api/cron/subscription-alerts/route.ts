import { NextRequest, NextResponse } from "next/server";
import {
  checkExpiringSubscriptions,
  expireOverdueSubscriptions,
  checkPendingEvaluations,
  sendSessionReminders,
} from "@/lib/automation/subscription-monitor";

/**
 * Cron endpoint — run daily.
 * Accepts a secret via Authorization header or ?secret= query param.
 *
 * Tasks:
 * 1. Expire overdue subscriptions
 * 2. Send expiry warnings (7-day)
 * 3. Remind coaches of pending evaluations
 * 4. Send session reminders to parents
 */
export async function GET(req: NextRequest) {
  // Simple secret check (set CRON_SECRET env var in production)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const [expired, expiring, evaluations, reminders] = await Promise.all([
      expireOverdueSubscriptions(),
      checkExpiringSubscriptions(7),
      checkPendingEvaluations(),
      sendSessionReminders(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: { expired, expiring, evaluations, reminders },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
