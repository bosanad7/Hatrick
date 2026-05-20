import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Pin } from "lucide-react";

async function getParentAnnouncements() {
  try {
    return await db.announcement.findMany({
      where: { target: { in: ["ALL", "PARENTS"] } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  } catch { return []; }
}

export default async function ParentAnnouncementsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([ Role.ADMIN, Role.PARENT] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const announcements = await getParentAnnouncements();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Announcements" subtitle={`${announcements.length} announcement${announcements.length !== 1 ? "s" : ""} for parents`} />
      <div className="flex-1 overflow-auto p-6 space-y-3">
        {announcements.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--muted-foreground)]">No announcements at this time.</p>
          </div>
        ) : announcements.map(a => (
          <Card key={a.id} className={a.pinned ? "border-l-2" : ""} style={a.pinned ? { borderLeftColor: "#f59e0b" } : {}}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                {a.pinned && <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{a.title}</p>
                    {a.pinned && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>Pinned</span>}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{a.body}</p>
                  <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(a.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
