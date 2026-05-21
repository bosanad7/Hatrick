import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));

  const awards = await db.bestPlayerOfMonth.findMany({
    where: { month, year },
    include: {
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          ageGroup: true,
          photo: true,
          playerType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ awards, month, year });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session!.user as { id?: string }).id ?? "";
  const body = await req.json();
  const { playerId, month, year, category, reason, achievement } = body;

  if (!playerId || !month || !year || !category) {
    return NextResponse.json({ error: "playerId, month, year, and category are required" }, { status: 400 });
  }

  // Check if already awarded
  const existing = await db.bestPlayerOfMonth.findUnique({
    where: { playerId_month_year_category: { playerId, month, year, category } },
  });
  if (existing) {
    return NextResponse.json({ error: "This player already has this award for this month" }, { status: 409 });
  }

  const award = await db.bestPlayerOfMonth.create({
    data: {
      playerId,
      month: parseInt(month),
      year: parseInt(year),
      category,
      reason: reason ?? null,
      achievement: achievement ?? null,
    },
    include: {
      player: {
        select: { id: true, firstName: true, lastName: true, ageGroup: true },
      },
    },
  });

  await logAudit({
    userId,
    action: "SELECT_BEST_PLAYER",
    entity: "BestPlayerOfMonth",
    entityId: award.id,
    details: { playerId, month, year, category },
  });

  return NextResponse.json({ award }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.bestPlayerOfMonth.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
