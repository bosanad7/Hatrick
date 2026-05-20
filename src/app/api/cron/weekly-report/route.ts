import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Weekly report cron — aggregates key metrics for the past 7 days.
 * Can be consumed by admin dashboards or sent via email.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      newPlayers,
      newSubscriptions,
      revenue,
      sessionsCompleted,
      ticketsCreated,
      ticketsResolved,
      evaluationsSubmitted,
    ] = await Promise.all([
      db.player.count({ where: { createdAt: { gte: weekAgo } } }),
      db.subscription.count({ where: { createdAt: { gte: weekAgo } } }),
      db.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: weekAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      db.trainingSession.count({ where: { status: "COMPLETED", endTime: { gte: weekAgo } } }),
      db.ticket.count({ where: { createdAt: { gte: weekAgo } } }),
      db.ticket.count({ where: { resolvedAt: { gte: weekAgo } } }),
      db.evaluation.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    // Notify all admins with a summary
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: "GENERAL",
          channel: "PLATFORM",
          title: "Weekly Report",
          body: `This week: ${newPlayers} new players, ${newSubscriptions} subscriptions, KWD ${(revenue._sum.amount ?? 0).toFixed(3)} revenue, ${sessionsCompleted} sessions, ${ticketsResolved}/${ticketsCreated} tickets resolved.`,
          metadata: JSON.stringify({
            period: { from: weekAgo.toISOString(), to: now.toISOString() },
            newPlayers,
            newSubscriptions,
            revenue: revenue._sum.amount ?? 0,
            sessionsCompleted,
            ticketsCreated,
            ticketsResolved,
            evaluationsSubmitted,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      report: {
        period: { from: weekAgo.toISOString(), to: now.toISOString() },
        newPlayers,
        newSubscriptions,
        revenue: { total: revenue._sum.amount ?? 0, count: revenue._count },
        sessionsCompleted,
        ticketsCreated,
        ticketsResolved,
        evaluationsSubmitted,
        adminsNotified: admins.length,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
