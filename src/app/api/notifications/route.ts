import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id ?? "";
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = parseInt(url.searchParams.get("limit") ?? "20");

  const notifications = await db.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await db.notification.count({
    where: { userId, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id ?? "";
  const body = await req.json();
  const { action, notificationId } = body;

  if (action === "markAllRead") {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "markRead" && notificationId) {
    await db.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
