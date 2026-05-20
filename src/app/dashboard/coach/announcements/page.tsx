import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Pin } from "lucide-react";
import { AudienceTarget } from "@prisma/client";

const targetColors: Record<AudienceTarget, string> = {
  ALL: "default",
  PARENTS: "secondary",
  COACHES: "outline",
  ADMINS: "warning",
  CALL_CENTER_STAFF: "outline",
} as const;

async function getCoachAnnouncements() {
  try {
    return await db.announcement.findMany({
      where: { target: { in: ["ALL", "COACHES"] } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function CoachAnnouncementsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.COACH] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const announcements = await getCoachAnnouncements();
  const pinnedCount = announcements.filter((a) => a.pinned).length;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Announcements"
        subtitle={`${announcements.length} total · ${pinnedCount} pinned`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Pinned</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                        No announcements yet.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr
                        key={ann.id}
                        className={`hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                          ann.pinned ? "bg-[rgba(245,158,11,0.05)]" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {ann.pinned && (
                              <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-[var(--foreground)]">{ann.title}</p>
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)] max-w-sm truncate">
                                {ann.body}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              targetColors[ann.target] as
                                | "default"
                                | "secondary"
                                | "outline"
                                | "warning"
                                | "destructive"
                            }
                          >
                            {ann.target}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {ann.pinned ? (
                            <Badge variant="warning">Pinned</Badge>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {formatDate(ann.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
