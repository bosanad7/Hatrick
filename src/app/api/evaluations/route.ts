import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { Role, AttendanceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_COACH_NOTES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const playerId = url.searchParams.get("playerId");
  const coachId = url.searchParams.get("coachId");

  const evaluations = await db.evaluation.findMany({
    where: {
      ...(sessionId ? { sessionId } : {}),
      ...(playerId ? { playerId } : {}),
      ...(coachId ? { coachId } : {}),
    },
    include: {
      player: true,
      coach: { include: { user: { select: { name: true } } } },
      session: { include: { group: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(evaluations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const userId = (session.user as { id?: string }).id;

  if (!can(role, PERMISSIONS.ADD_COACH_NOTES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get coach record
  const coach = await db.coach.findUnique({ where: { userId: userId ?? "" } });
  if (!coach) {
    return NextResponse.json({ error: "Coach record not found" }, { status: 404 });
  }

  const body = await req.json();
  const { evaluations } = body;

  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return NextResponse.json({ error: "evaluations array required" }, { status: 400 });
  }

  const results = [];
  for (const ev of evaluations) {
    const {
      playerId, sessionId, attendance,
      discipline, technical, tactical, fitness, teamwork,
      notes, recommendation,
    } = ev;

    if (!playerId) continue;

    // Validate scores are 1-10
    for (const score of [discipline, technical, tactical, fitness, teamwork]) {
      if (score !== undefined && (score < 1 || score > 10)) {
        return NextResponse.json({ error: "Scores must be between 1 and 10" }, { status: 400 });
      }
    }

    const evaluation = await db.evaluation.create({
      data: {
        playerId,
        coachId: coach.id,
        sessionId: sessionId || null,
        attendance: (attendance as AttendanceStatus) || "PRESENT",
        discipline: discipline ?? 5,
        technical: technical ?? 5,
        tactical: tactical ?? 5,
        fitness: fitness ?? 5,
        teamwork: teamwork ?? 5,
        notes: notes || null,
        recommendation: recommendation || null,
      },
    });

    results.push(evaluation);
  }

  return NextResponse.json(results, { status: 201 });
}
