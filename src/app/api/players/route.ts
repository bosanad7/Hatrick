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
    playerType,
    clothingSize,
    preferredShirtName,
    preferredShirtNumber,
    freeTrialUsed,
    // Registration wizard fields for parent lookup/creation
    parentEmail,
    parentName,
    parentPhone,
    parentAddress,
  } = body;

  if (!firstName || !lastName || !dateOfBirth || !ageGroup) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Resolve parentId — either provided directly or look up / create from email
  let resolvedParentId = parentId;

  if (parentId === "LOOKUP" && parentEmail) {
    // Find or create parent by email
    let user = await db.user.findUnique({ where: { email: parentEmail } });
    if (!user) {
      const bcrypt = await import("bcryptjs");
      const tempPassword = await bcrypt.hash(`hattrick${Date.now()}`, 10);
      user = await db.user.create({
        data: {
          email: parentEmail,
          name: parentName || parentEmail,
          phone: parentPhone || null,
          password: tempPassword,
          role: "PARENT",
        },
      });
    }

    let parent = await db.parent.findUnique({ where: { userId: user.id } });
    if (!parent) {
      parent = await db.parent.create({
        data: {
          userId: user.id,
          phone: parentPhone || null,
          address: parentAddress || null,
        },
      });
    }
    resolvedParentId = parent.id;
  }

  if (!resolvedParentId) {
    return NextResponse.json({ error: "Parent ID is required." }, { status: 400 });
  }

  const player = await db.player.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender: (gender as Gender) ?? "MALE",
      ageGroup: ageGroup as AgeGroup,
      playerType: playerType || "OUTFIELD",
      nationality: nationality || null,
      position: position || null,
      jerseyNumber: jerseyNumber ? parseInt(String(jerseyNumber)) : null,
      medicalNotes: medicalNotes || null,
      parentId: resolvedParentId,
      clothingSize: clothingSize || null,
      preferredShirtName: preferredShirtName || null,
      preferredShirtNumber: preferredShirtNumber ? parseInt(String(preferredShirtNumber)) : null,
      freeTrialUsed: freeTrialUsed === true,
      freeTrialDate: freeTrialUsed ? new Date() : null,
    },
  });

  return NextResponse.json({ ...player, parentId: resolvedParentId }, { status: 201 });
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
