import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { CoachRole, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_COACHES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, coachRole, speciality, licenseNo, bio } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  // Ensure user exists and doesn't already have a coach profile
  const existing = await db.coach.findUnique({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "This user already has a coach profile." }, { status: 409 });
  }

  const coach = await db.coach.create({
    data: {
      userId,
      coachRole: (coachRole as CoachRole) ?? "ASSISTANT_COACH",
      speciality: speciality || null,
      licenseNo: licenseNo || null,
      bio: bio || null,
    },
    include: { user: true },
  });

  return NextResponse.json(coach, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ALL_COACHES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coaches = await db.coach.findMany({
    include: { user: true },
    orderBy: { hireDate: "desc" },
  });

  return NextResponse.json(coaches);
}
