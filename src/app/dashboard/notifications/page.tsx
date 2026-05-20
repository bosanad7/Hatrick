import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell, CreditCard, Calendar, Star, Megaphone, AlertCircle,
} from "lucide-react";

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  SUB_EXPIRY:       { icon: AlertCircle, color: "#fbbf24" },
  SESSION_REMINDER: { icon: Calendar,    color: "#ffffff" },
  MATCH:            { icon: Star,        color: "#cccccc" },
  EVENT:            { icon: Megaphone,   color: "#aaaaaa" },
  CANCELLATION:     { icon: AlertCircle, color: "#f87171" },
  PAYMENT_CONFIRM:  { icon: CreditCard,  color: "#ffffff" },
  COACH_FEEDBACK:   { icon: Star,        color: "#cccccc" },
  GENERAL:          { icon: Bell,        color: "#aaaaaa" },
};

async function getNotifications(userId: string) {
  try {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id ?? "";
  const notifications = await getNotifications(userId);

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Notifications"
        subtitle={`${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                No notifications yet. You&apos;ll see updates here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {unread.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  Unread
                </h2>
                {unread.map((n) => <NotifCard key={n.id} n={n} />)}
              </div>
            )}

            {read.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  Earlier
                </h2>
                {read.map((n) => <NotifCard key={n.id} n={n} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotifCard({ n }: { n: { id: string; type: string; title: string; body: string; isRead: boolean; createdAt: Date } }) {
  const tc = typeConfig[n.type] ?? typeConfig.GENERAL;
  const Icon = tc.icon;

  return (
    <Card style={!n.isRead ? { borderLeftWidth: 2, borderLeftColor: "var(--foreground)" } : {}}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <Icon className="h-4 w-4" style={{ color: tc.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{n.title}</p>
            {!n.isRead && (
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--primary)" }} />
            )}
          </div>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{n.body}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{n.type.replace(/_/g, " ")}</Badge>
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
