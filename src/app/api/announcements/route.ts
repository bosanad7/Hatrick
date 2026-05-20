import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { AudienceTarget, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, body: messageBody, target, pinned } = body;

  if (!title || !messageBody) {
    return NextResponse.json({ error: "title and body are required." }, { status: 400 });
  }

  const announcement = await db.announcement.create({
    data: {
      title,
      body: messageBody,
      target: (target as AudienceTarget) ?? "ALL",
      pinned: pinned === true || pinned === "true",
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ANNOUNCEMENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(announcements);
}
