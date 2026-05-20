import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { AgeGroup, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_GROUPS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, ageGroup, maxCapacity, description } = body;

  if (!name || !ageGroup) {
    return NextResponse.json({ error: "name and ageGroup are required." }, { status: 400 });
  }

  const group = await db.group.create({
    data: {
      name,
      ageGroup: ageGroup as AgeGroup,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : 20,
      description: description || null,
    },
  });

  return NextResponse.json(group, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ALL_GROUPS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groups = await db.group.findMany({
    include: {
      _count: { select: { groupPlayers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}
