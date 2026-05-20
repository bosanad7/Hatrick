import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { PitchName, BookingType, BookingStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_PITCHES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { pitch, type, bookedBy, startTime, endTime, totalAmount, notes } = body;

  if (!pitch || !type || !bookedBy || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const booking = await db.pitchBooking.create({
    data: {
      pitch: pitch as PitchName,
      type: type as BookingType,
      bookedBy,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_PITCHES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const pitch = searchParams.get("pitch");
  const status = searchParams.get("status");

  const bookings = await db.pitchBooking.findMany({
    where: {
      ...(pitch ? { pitch: pitch as PitchName } : {}),
      ...(status ? { status: status as BookingStatus } : {}),
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}
