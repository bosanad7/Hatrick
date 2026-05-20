import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { AgeGroup, Gender, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_PLAYERS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    ageGroup,
    nationality,
    position,
    jerseyNumber,
    medicalNotes,
    parentId,
  } = body;

  if (!firstName || !lastName || !dateOfBirth || !ageGroup || !parentId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const player = await db.player.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender: (gender as Gender) ?? "MALE",
      ageGroup: ageGroup as AgeGroup,
      nationality: nationality || null,
      position: position || null,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
      medicalNotes: medicalNotes || null,
      parentId,
    },
  });

  return NextResponse.json(player, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ALL_PLAYERS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const players = await db.player.findMany({
    include: { parent: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(players);
}
