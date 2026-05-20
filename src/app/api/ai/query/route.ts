import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * Real data-driven AI query endpoint.
 * Accepts a prompt, matches it to known intents, queries the DB, and returns structured data.
 * This avoids needing an external LLM API — it's a rules-based "AI" backed by real data.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const lower = prompt.toLowerCase();

  try {
    // Intent: overdue payments
    if (lower.includes("unpaid") || lower.includes("overdue") || lower.includes("payment")) {
      return NextResponse.json(await getPaymentInsights());
    }

    // Intent: attendance
    if (lower.includes("attendance") || lower.includes("absent")) {
      return NextResponse.json(await getAttendanceInsights());
    }

    // Intent: schedule
    if (lower.includes("schedule") || lower.includes("session") || lower.includes("upcoming")) {
      return NextResponse.json(await getScheduleInsights());
    }

    // Intent: report / summary
    if (lower.includes("report") || lower.includes("summary") || lower.includes("monthly") || lower.includes("overview")) {
      return NextResponse.json(await getMonthlyReport());
    }

    // Intent: subscriptions
    if (lower.includes("subscription") || lower.includes("expir") || lower.includes("renewal")) {
      return NextResponse.json(await getSubscriptionInsights());
    }

    // Intent: tickets / support
    if (lower.includes("ticket") || lower.includes("support") || lower.includes("complaint")) {
      return NextResponse.json(await getTicketInsights());
    }

    // Intent: players / enrollment
    if (lower.includes("player") || lower.includes("enroll") || lower.includes("age group")) {
      return NextResponse.json(await getPlayerInsights());
    }

    // Intent: announcements
    if (lower.includes("announcement") || lower.includes("message") || lower.includes("draft")) {
      return NextResponse.json({
        type: "announcement",
        content: generateAnnouncementDraft(),
      });
    }

    // Default: general stats
    return NextResponse.json(await getGeneralStats());
  } catch (err) {
    return NextResponse.json({ type: "error", content: `Error fetching data: ${String(err)}` });
  }
}

async function getPaymentInsights() {
  const [overdue, pending, recentPaid] = await Promise.all([
    db.payment.findMany({
      where: { status: "OVERDUE" },
      include: { parent: { include: { user: { select: { name: true, email: true } } } }, player: true },
      take: 20,
    }),
    db.payment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: true }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
  ]);

  const overdueList = overdue.map((p) => ({
    parent: p.parent?.user?.name ?? "Unknown",
    email: p.parent?.user?.email ?? "",
    player: p.player ? `${p.player.firstName} ${p.player.lastName}` : "—",
    amount: p.amount,
    dueDate: p.dueDate.toISOString().split("T")[0],
  }));

  let content = `## Payment Overview\n\n`;
  content += `**Overdue:** ${overdue.length} payments\n`;
  content += `**Pending:** ${pending._count} invoices (KWD ${(pending._sum.amount ?? 0).toFixed(3)})\n`;
  content += `**Collected:** ${recentPaid._count} payments (KWD ${(recentPaid._sum.amount ?? 0).toFixed(3)})\n\n`;

  if (overdueList.length > 0) {
    content += `### Overdue Payments\n\n`;
    content += `| Parent | Player | Amount | Due Date |\n|--------|--------|--------|----------|\n`;
    overdueList.forEach((o) => {
      content += `| ${o.parent} | ${o.player} | KWD ${o.amount.toFixed(3)} | ${o.dueDate} |\n`;
    });
    content += `\n**Recommendation:** Send payment reminders to overdue parents and consider offering a flexible payment plan.`;
  } else {
    content += `No overdue payments at this time. Great job keeping collections current!`;
  }

  return { type: "payments", content };
}

async function getAttendanceInsights() {
  const ageGroups = ["U5", "U7", "U9", "U11", "U13", "U15"];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const results = await Promise.all(
    ageGroups.map(async (ag) => {
      const total = await db.attendance.count({
        where: {
          player: { ageGroup: ag as never },
          createdAt: { gte: monthStart },
        },
      });
      const present = await db.attendance.count({
        where: {
          player: { ageGroup: ag as never },
          status: "PRESENT",
          createdAt: { gte: monthStart },
        },
      });
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return { ageGroup: ag, total, present, rate };
    })
  );

  const overallTotal = results.reduce((s, r) => s + r.total, 0);
  const overallPresent = results.reduce((s, r) => s + r.present, 0);
  const overallRate = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  let content = `## Attendance Summary — This Month\n\n`;
  content += `**Overall attendance rate: ${overallRate}%**\n\n`;
  content += `| Age Group | Records | Present | Rate |\n|-----------|---------|---------|------|\n`;
  results.forEach((r) => {
    const emoji = r.rate >= 80 ? "🟢" : r.rate >= 70 ? "🟡" : r.rate >= 60 ? "🟠" : "🔴";
    content += `| ${r.ageGroup} | ${r.total} | ${r.present} | ${r.rate}% ${emoji} |\n`;
  });

  const lowGroups = results.filter((r) => r.rate > 0 && r.rate < 70);
  if (lowGroups.length > 0) {
    content += `\n**Alert:** ${lowGroups.map((g) => g.ageGroup).join(", ")} attendance is below 70%. Consider reviewing session times and sending parent reminders.`;
  }

  return { type: "attendance", content };
}

async function getScheduleInsights() {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const sessions = await db.trainingSession.findMany({
    where: { startTime: { gte: now, lte: weekEnd }, status: "SCHEDULED" },
    include: { group: true, coach: { include: { user: true } } },
    orderBy: { startTime: "asc" },
  });

  let content = `## Upcoming Sessions (Next 7 Days)\n\n`;
  if (sessions.length === 0) {
    content += `No sessions scheduled for the next 7 days.`;
  } else {
    content += `| Day | Time | Group | Pitch | Coach |\n|-----|------|-------|-------|-------|\n`;
    sessions.forEach((s) => {
      const day = s.startTime.toLocaleDateString("en-US", { weekday: "long" });
      const time = `${s.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – ${s.endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
      content += `| ${day} | ${time} | ${s.group?.name ?? "—"} | ${s.pitch} | ${s.coach?.user?.name ?? "—"} |\n`;
    });
    content += `\n**${sessions.length} sessions** scheduled this week.`;
  }

  return { type: "schedule", content };
}

async function getMonthlyReport() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const [
    totalPlayers, activePlayers, newPlayers,
    revenue, sessionsCompleted, activeSubscriptions,
    openTickets,
  ] = await Promise.all([
    db.player.count(),
    db.player.count({ where: { status: "ACTIVE" } }),
    db.player.count({ where: { createdAt: { gte: monthStart } } }),
    db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
    db.trainingSession.count({ where: { status: "COMPLETED", endTime: { gte: monthStart } } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  let content = `## Monthly Report — ${monthName}\n\n`;
  content += `### Key Metrics\n`;
  content += `- **Total Players:** ${totalPlayers} (${activePlayers} active)\n`;
  content += `- **New Enrollments:** ${newPlayers} this month\n`;
  content += `- **Revenue:** KWD ${(revenue._sum.amount ?? 0).toFixed(3)} (${revenue._count} payments)\n`;
  content += `- **Sessions Completed:** ${sessionsCompleted}\n`;
  content += `- **Active Subscriptions:** ${activeSubscriptions}\n`;
  content += `- **Open Tickets:** ${openTickets}\n\n`;
  content += `### Recommendations\n`;
  content += `1. ${newPlayers > 0 ? `Great momentum — ${newPlayers} new player${newPlayers > 1 ? "s" : ""} enrolled!` : "Focus on enrollment campaigns to attract new players."}\n`;
  content += `2. ${openTickets > 5 ? "High support load — consider assigning more staff to tickets." : "Support load is manageable."}\n`;
  content += `3. Review subscription renewals coming up in the next 30 days.\n\n`;
  content += `*Report generated from live data · ${now.toLocaleDateString()}*`;

  return { type: "report", content };
}

async function getSubscriptionInsights() {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [active, frozen, expired, expiringCount] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "FROZEN" } }),
    db.subscription.count({ where: { status: "EXPIRED" } }),
    db.subscription.count({ where: { status: "ACTIVE", endDate: { lte: thirtyDays } } }),
  ]);

  let content = `## Subscription Overview\n\n`;
  content += `- **Active:** ${active}\n`;
  content += `- **Frozen:** ${frozen}\n`;
  content += `- **Expired:** ${expired}\n`;
  content += `- **Expiring in 30 days:** ${expiringCount}\n\n`;

  if (expiringCount > 0) {
    content += `**Action Required:** ${expiringCount} subscription${expiringCount > 1 ? "s" : ""} will expire within 30 days. Send renewal reminders to parents.`;
  } else {
    content += `All active subscriptions have more than 30 days remaining.`;
  }

  return { type: "subscriptions", content };
}

async function getTicketInsights() {
  const [open, inProgress, resolved, total] = await Promise.all([
    db.ticket.count({ where: { status: "OPEN" } }),
    db.ticket.count({ where: { status: "IN_PROGRESS" } }),
    db.ticket.count({ where: { status: "RESOLVED" } }),
    db.ticket.count(),
  ]);

  let content = `## Support Ticket Overview\n\n`;
  content += `| Status | Count |\n|--------|-------|\n`;
  content += `| Open | ${open} |\n`;
  content += `| In Progress | ${inProgress} |\n`;
  content += `| Resolved | ${resolved} |\n`;
  content += `| Total | ${total} |\n\n`;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  content += `**Resolution Rate:** ${resolutionRate}%\n`;
  if (open > 5) {
    content += `\n**Alert:** ${open} unresolved tickets. Prioritize by urgency and assign to available agents.`;
  }

  return { type: "tickets", content };
}

async function getPlayerInsights() {
  const ageGroups = await db.player.groupBy({
    by: ["ageGroup"],
    _count: { id: true },
    orderBy: { ageGroup: "asc" },
  });

  const total = ageGroups.reduce((s, g) => s + g._count.id, 0);
  let content = `## Player Overview\n\n`;
  content += `**Total Players:** ${total}\n\n`;
  content += `| Age Group | Count | Share |\n|-----------|-------|-------|\n`;
  ageGroups.forEach((g) => {
    const pct = total > 0 ? Math.round((g._count.id / total) * 100) : 0;
    content += `| ${g.ageGroup} | ${g._count.id} | ${pct}% |\n`;
  });

  return { type: "players", content };
}

function generateAnnouncementDraft() {
  const date = new Date();
  const nextWeek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

  return `## Draft Announcement

---

**Hattrick Heroes Academy — Weekly Update**

Dear Parents and Guardians,

We hope you and your families are well! Here are this week's updates:

**Training Schedule**
All sessions will proceed as scheduled from ${nextWeek.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.

**Reminders**
- Please ensure your child arrives 10 minutes before their session
- Bring water bottles and proper football boots
- Payments should be settled before the next session

**Contact Us**
For any questions or concerns, please reach out through the support portal.

Best regards,
**Hattrick Academy Management**

---

*Feel free to edit this draft before sending.*`;
}

async function getGeneralStats() {
  const [players, coaches, sessions, subs] = await Promise.all([
    db.player.count({ where: { status: "ACTIVE" } }),
    db.coach.count(),
    db.trainingSession.count({ where: { status: "SCHEDULED", startTime: { gte: new Date() } } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  const content = `## Academy Overview

I'm your Hattrick Academy AI Assistant, powered by **live data**.

**Current Stats:**
- **${players}** active players
- **${coaches}** coaching staff
- **${sessions}** upcoming sessions
- **${subs}** active subscriptions

I can help you with:
- **Payment insights** — overdue, pending, revenue
- **Attendance analysis** — rates by age group
- **Schedule management** — upcoming sessions
- **Monthly reports** — comprehensive summaries
- **Subscription status** — active, expiring, frozen
- **Support tickets** — open, resolution rate
- **Player analytics** — enrollment by age group
- **Announcements** — draft professional messages

What would you like to know?`;

  return { type: "general", content };
}
