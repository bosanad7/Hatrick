import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnnouncementsClient } from "./announcements-client";

async function getAnnouncements() {
  try {
    return await db.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function AnnouncementsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const announcements = await getAnnouncements();
  const pinnedCount = announcements.filter((a) => a.pinned).length;

  const rows = announcements.map((ann) => ({
    id: ann.id,
    title: ann.title,
    body: ann.body,
    target: ann.target,
    pinned: ann.pinned,
    createdAt: formatDate(ann.createdAt),
  }));

  return (
    <AnnouncementsClient
      announcements={rows}
      pinnedCount={pinnedCount}
    />
  );
}
