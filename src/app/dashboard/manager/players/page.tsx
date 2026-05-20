import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getAge } from "@/lib/utils";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerStatus, AgeGroup, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getPlayers(search?: string, ageGroup?: string, status?: string) {
  try {
    return await db.player.findMany({
      where: {
        ...(search ? { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] } : {}),
        ...(ageGroup ? { ageGroup: ageGroup as AgeGroup } : {}),
        ...(status ? { status: status as PlayerStatus } : {}),
      },
      include: { parent: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch { return []; }
}

export default async function ManagerPlayersPage({ searchParams }: { searchParams: Promise<{ search?: string; ageGroup?: string; status?: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const params = await searchParams;
  const players = await getPlayers(params.search, params.ageGroup, params.status);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Players" subtitle={`${players.length} players registered · read-only view`} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input name="search" defaultValue={params.search} placeholder="Search players..."
                className="h-10 rounded-lg border border-input bg-[var(--card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64" />
            </div>
            <select name="ageGroup" defaultValue={params.ageGroup}
              className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Age Groups</option>
              {Object.values(AgeGroup).map(g => <option key={g} value={g}>{g.replace("U","Under ")}</option>)}
            </select>
            <select name="status" defaultValue={params.status}
              className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Statuses</option>
              {Object.values(PlayerStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button type="submit" variant="secondary" size="sm">Filter</Button>
          </form>
        </div>
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Player</th><th className="px-4 py-3">Age Group</th>
                <th className="px-4 py-3">Age</th><th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Parent</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Enrolled</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {players.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--muted-foreground)]">No players found.</td></tr>
                ) : players.map(player => (
                  <tr key={player.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                          {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{player.firstName} {player.lastName}</p>
                          {player.jerseyNumber && <p className="text-xs text-[var(--muted-foreground)]">#{player.jerseyNumber}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge>{player.ageGroup}</Badge></td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{getAge(player.dateOfBirth)} yrs</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{player.position ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{player.parent.user.name ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={player.status === "ACTIVE" ? "default" : player.status === "SUSPENDED" ? "destructive" : "secondary"}>{player.status}</Badge></td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(player.enrollmentDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
