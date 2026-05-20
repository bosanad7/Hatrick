import { db } from "@/lib/db";

/**
 * Check for subscriptions expiring within `daysAhead` days
 * and create platform notifications for the parent.
 */
export async function checkExpiringSubscriptions(daysAhead = 7) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const expiring = await db.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: cutoff },
    },
    include: {
      player: true,
      parent: { include: { user: true } },
    },
  });

  const created: string[] = [];

  for (const sub of expiring) {
    const userId = sub.parent?.user?.id;
    if (!userId) continue;

    // Avoid duplicate notifications (check if one exists in last 24h)
    const recent = await db.notification.findFirst({
      where: {
        userId,
        type: "SUB_EXPIRY",
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        body: { contains: sub.player?.firstName ?? "" },
      },
    });
    if (recent) continue;

    const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const playerName = `${sub.player?.firstName ?? ""} ${sub.player?.lastName ?? ""}`.trim();

    await db.notification.create({
      data: {
        userId,
        type: "SUB_EXPIRY",
        channel: "PLATFORM",
        title: "Subscription Expiring Soon",
        body: `${playerName}'s subscription expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Renew now to avoid interruption.`,
        metadata: JSON.stringify({ subscriptionId: sub.id, playerId: sub.playerId, daysLeft }),
      },
    });
    created.push(sub.id);
  }

  return { checked: expiring.length, notified: created.length, ids: created };
}

/**
 * Flag subscriptions that are past their end date as EXPIRED.
 */
export async function expireOverdueSubscriptions() {
  const now = new Date();

  const result = await db.subscription.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  return { expired: result.count };
}

/**
 * Check for sessions with no evaluation submitted (older than 2 days).
 * Notify coaches.
 */
export async function checkPendingEvaluations() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const sessions = await db.trainingSession.findMany({
    where: {
      status: "COMPLETED",
      endTime: { lt: twoDaysAgo },
    },
    include: {
      coach: { include: { user: true } },
      evaluations: { select: { id: true } },
      group: true,
    },
  });

  const pending = sessions.filter((s) => s.evaluations.length === 0);
  let notified = 0;

  for (const session of pending) {
    const userId = session.coach?.user?.id;
    if (!userId) continue;

    // Avoid duplicates
    const recent = await db.notification.findFirst({
      where: {
        userId,
        type: "COACH_FEEDBACK",
        createdAt: { gte: twoDaysAgo },
        body: { contains: session.title },
      },
    });
    if (recent) continue;

    await db.notification.create({
      data: {
        userId,
        type: "COACH_FEEDBACK",
        channel: "PLATFORM",
        title: "Evaluation Pending",
        body: `Please submit evaluations for "${session.title}" (${session.group?.name ?? ""}).`,
        metadata: JSON.stringify({ sessionId: session.id }),
      },
    });
    notified++;
  }

  return { pendingSessions: pending.length, notified };
}

/**
 * Check for upcoming sessions within the next 24h and notify parents.
 */
export async function sendSessionReminders() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await db.trainingSession.findMany({
    where: {
      status: "SCHEDULED",
      startTime: { gte: now, lte: tomorrow },
    },
    include: {
      group: {
        include: {
          groupPlayers: {
            include: {
              player: {
                include: {
                  parent: { include: { user: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  let notified = 0;

  for (const session of upcoming) {
    const players = session.group?.groupPlayers ?? [];
    for (const gp of players) {
      const userId = gp.player?.parent?.user?.id;
      if (!userId) continue;

      // Avoid duplicates
      const recent = await db.notification.findFirst({
        where: {
          userId,
          type: "SESSION_REMINDER",
          createdAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
          body: { contains: session.title },
        },
      });
      if (recent) continue;

      const time = session.startTime.toLocaleTimeString("en-KW", { hour: "2-digit", minute: "2-digit" });
      await db.notification.create({
        data: {
          userId,
          type: "SESSION_REMINDER",
          channel: "PLATFORM",
          title: "Session Tomorrow",
          body: `${gp.player.firstName} has "${session.title}" at ${time} tomorrow.`,
          metadata: JSON.stringify({ sessionId: session.id, playerId: gp.player.id }),
        },
      });
      notified++;
    }
  }

  return { sessions: upcoming.length, notified };
}
