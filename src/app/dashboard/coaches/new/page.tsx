import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { NewCoachForm } from "@/components/coaches/new-coach-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function NewCoachPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  // Fetch users with COACH role who don't yet have a coach profile
  let users: Awaited<ReturnType<typeof db.user.findMany>> = [];
  try {
    users = await db.user.findMany({
      where: { coach: null },
      orderBy: { name: "asc" },
    });
  } catch { /* db not ready */ }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Add New Coach" subtitle="Register a new coaching staff member" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <NewCoachForm
            users={users.map((u) => ({
              id: u.id,
              name: u.name ?? u.email ?? u.id,
              email: u.email,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
