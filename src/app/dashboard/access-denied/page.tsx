import { ShieldX } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardPath, ROLE_LABELS, ROLE_COLORS, PERMISSIONS } from "@/lib/permissions";
import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ from?: string; required?: string }>;
}

/** Maps a protected route prefix to a human-readable section name. */
function sectionFromPath(from: string): string {
  const map: Record<string, string> = {
    "/dashboard/players":       "Players",
    "/dashboard/coaches":       "Coaches",
    "/dashboard/groups":        "Groups",
    "/dashboard/schedule":      "Schedule",
    "/dashboard/pitches":       "Pitches",
    "/dashboard/payments":      "Payments",
    "/dashboard/reports":       "Reports",
    "/dashboard/announcements": "Announcements",
    "/dashboard/ai":            "AI Assistant",
    "/dashboard/admin":         "Admin Dashboard",
    "/dashboard/manager":       "Manager Dashboard",
    "/dashboard/coach":         "Coach Dashboard",
    "/dashboard/parent":        "Parent Dashboard",
  };
  for (const [prefix, label] of Object.entries(map)) {
    if (from.startsWith(prefix)) return label;
  }
  return "that page";
}

/** Returns a short description of what each role CAN access. */
function roleCanAccessSummary(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return "You have full access to all sections of the platform.";
    case Role.MANAGER:
      return "You can access: Manager Dashboard, Players (view), Coaches (view), Groups (view), Schedule, Payments, Reports, and Announcements.";
    case Role.COACH:
      return "You can access: Coach Dashboard, My Sessions, My Groups, Attendance, Coach Notes, and Announcements.";
    case Role.PARENT:
      return "You can access: Parent Dashboard, My Children, Schedule, Attendance, Payments, and Announcements.";
    case Role.CALL_CENTER:
      return "You can access: Call Center Dashboard, Tickets, and Messages.";
  }
}

export default async function AccessDeniedPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const dashboardPath = getDashboardPath(role);
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];

  const params = await searchParams;
  const from = params.from ? decodeURIComponent(params.from) : null;
  const section = from ? sectionFromPath(from) : null;
  const canSummary = roleCanAccessSummary(role);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center p-8"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <ShieldX className="h-8 w-8" style={{ color: "#f87171" }} />
        </div>

        {/* Heading */}
        <h1
          className="mb-2 text-xl font-bold"
          style={{ color: "var(--foreground)" }}
        >
          Access Denied
        </h1>

        {/* Context-aware message */}
        <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>
          {section
            ? <>You don&apos;t have permission to view <strong style={{ color: "var(--foreground)" }}>{section}</strong>.</>
            : <>You don&apos;t have permission to view this page.</>
          }
        </p>

        {/* Role badge */}
        <div className="my-4 flex items-center justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ background: roleColor.bg, color: roleColor.text }}
          >
            {roleLabel}
          </span>
        </div>

        {/* What can they access */}
        <div
          className="mb-6 rounded-xl p-4 text-left text-xs"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <p className="mb-1 font-semibold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
            What you can access:
          </p>
          <p>{canSummary}</p>
        </div>

        {/* Back to dashboard */}
        <Link
          href={dashboardPath}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Go to My Dashboard
        </Link>
      </div>
    </div>
  );
}
