import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { NewSessionForm } from "@/components/schedule/new-session-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function NewSessionPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  let groups: Awaited<ReturnType<typeof db.group.findMany>> = [];
  let coaches: Awaited<ReturnType<typeof db.coach.findMany<{ include: { user: true } }>>> = [];
  try {
    [groups, coaches] = await Promise.all([
      db.group.findMany({ orderBy: { name: "asc" } }),
      db.coach.findMany({
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      }),
    ]);
  } catch { /* db not ready */ }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Schedule Session"
        subtitle="Add a new training session to the calendar"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <NewSessionForm
            groups={groups.map((g) => ({
              id: g.id,
              name: g.name,
              ageGroup: g.ageGroup,
            }))}
            coaches={coaches.map((c) => ({
              id: c.id,
              name: c.user.name ?? c.user.email ?? c.id,
              coachRole: c.coachRole,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
