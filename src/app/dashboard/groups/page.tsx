import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { GroupsTable } from "@/components/groups/groups-table";

async function getGroups() {
  try {
    return await db.group.findMany({
      include: {
        _count: { select: { groupPlayers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function GroupsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const groups = await getGroups();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Training Groups" subtitle={`${groups.length} groups active`} />

      <GroupsTable groups={JSON.parse(JSON.stringify(groups))} />
    </div>
  );
}
