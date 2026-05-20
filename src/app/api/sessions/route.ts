import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { PitchName, SessionStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_SCHEDULE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, groupId, coachId, pitch, startTime, endTime, notes } = body;

  if (!title || !groupId || !coachId || !pitch || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const trainingSession = await db.trainingSession.create({
    data: {
      title,
      groupId,
      coachId,
      pitch: pitch as PitchName,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes: notes || null,
    },
    include: {
      group: true,
      coach: { include: { user: true } },
    },
  });

  return NextResponse.json(trainingSession, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ALL_SCHEDULE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  let dateFilter = {};
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    dateFilter = { startTime: { gte: start, lte: end } };
  }

  const sessions = await db.trainingSession.findMany({
    where: {
      ...(status ? { status: status as SessionStatus } : {}),
      ...dateFilter,
    },
    include: {
      group: true,
      coach: { include: { user: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(sessions);
}
