import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * Export reports as CSV (lightweight, no external deps).
 * Query params: type (players|payments|attendance|subscriptions), format (csv)
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "players";

  let csv = "";
  let filename = "";

  switch (type) {
    case "players": {
      const players = await db.player.findMany({
        include: { parent: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      });
      csv = "ID,First Name,Last Name,Age Group,Status,Player Type,Parent,Enrollment Date\n";
      csv += players
        .map((p) =>
          [
            p.id,
            p.firstName,
            p.lastName,
            p.ageGroup,
            p.status,
            p.playerType,
            p.parent?.user?.name ?? "",
            p.enrollmentDate.toISOString().split("T")[0],
          ].join(",")
        )
        .join("\n");
      filename = "players-export.csv";
      break;
    }
    case "payments": {
      const payments = await db.payment.findMany({
        include: {
          parent: { include: { user: true } },
          player: true,
        },
        orderBy: { createdAt: "desc" },
      });
      csv = "ID,Parent,Player,Type,Amount,Currency,Status,Due Date,Paid At\n";
      csv += payments
        .map((p) =>
          [
            p.id,
            p.parent?.user?.name ?? "",
            p.player ? `${p.player.firstName} ${p.player.lastName}` : "",
            p.type,
            p.amount.toFixed(3),
            p.currency,
            p.status,
            p.dueDate.toISOString().split("T")[0],
            p.paidAt ? p.paidAt.toISOString().split("T")[0] : "",
          ].join(",")
        )
        .join("\n");
      filename = "payments-export.csv";
      break;
    }
    case "attendance": {
      const attendance = await db.attendance.findMany({
        include: {
          player: true,
          session: { include: { group: true, coach: { include: { user: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      csv = "Date,Session,Group,Coach,Player,Status,Note\n";
      csv += attendance
        .map((a) =>
          [
            a.session?.startTime?.toISOString().split("T")[0] ?? "",
            a.session?.title ?? "",
            a.session?.group?.name ?? "",
            a.session?.coach?.user?.name ?? "",
            `${a.player?.firstName ?? ""} ${a.player?.lastName ?? ""}`,
            a.status,
            (a.note ?? "").replace(/,/g, ";"),
          ].join(",")
        )
        .join("\n");
      filename = "attendance-export.csv";
      break;
    }
    case "subscriptions": {
      const subs = await db.subscription.findMany({
        include: {
          player: true,
          parent: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      csv = "ID,Player,Parent,Type,Status,Start,End,Amount,Discount,Sessions Used\n";
      csv += subs
        .map((s) =>
          [
            s.id,
            `${s.player?.firstName ?? ""} ${s.player?.lastName ?? ""}`,
            s.parent?.user?.name ?? "",
            s.type,
            s.status,
            s.startDate.toISOString().split("T")[0],
            s.endDate.toISOString().split("T")[0],
            s.amount.toFixed(3),
            s.discount.toFixed(3),
            `${s.usedSessions}/${s.totalSessions ?? "N/A"}`,
          ].join(",")
        )
        .join("\n");
      filename = "subscriptions-export.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
