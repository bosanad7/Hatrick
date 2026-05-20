import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { PlayerStatus, AgeGroup, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlayersTable } from "@/components/players/players-table";

async function getPlayers(search?: string, ageGroup?: string, status?: string) {
  try { return await db.player.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          }
        : {}),
      ...(ageGroup ? { ageGroup: ageGroup as AgeGroup } : {}),
      ...(status ? { status: status as PlayerStatus } : {}),
    },
    include: { parent: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  }); } catch { return []; }
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; ageGroup?: string; status?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const params = await searchParams;
  const players = await getPlayers(params.search, params.ageGroup, params.status);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Players" subtitle={`${players.length} players registered`} />

      <PlayersTable
        players={JSON.parse(JSON.stringify(players))}
        searchParams={params}
        ageGroups={Object.values(AgeGroup)}
        playerStatuses={Object.values(PlayerStatus)}
      />
    </div>
  );
}
