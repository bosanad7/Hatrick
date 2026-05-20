import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CoachesTable } from "@/components/coaches/coaches-table";

async function getCoaches() {
  try {
    return await db.coach.findMany({
      include: { user: true },
      orderBy: { hireDate: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function CoachesPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const coaches = await getCoaches();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Coaches" subtitle={`${coaches.length} coaches on staff`} />

      <CoachesTable coaches={JSON.parse(JSON.stringify(coaches))} />
    </div>
  );
}
