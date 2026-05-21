import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { BestPlayerForm } from "@/components/admin/best-player-form";
import { BestPlayersContent } from "@/components/admin/best-players-content";

const CATEGORIES = ["MVP", "Best Attacker", "Best Defender", "Best Goalkeeper", "Most Improved", "Best Teamwork"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

async function getData(month: number, year: number) {
  const [awards, players] = await Promise.all([
    db.bestPlayerOfMonth.findMany({
      where: { month, year },
      include: {
        player: {
          select: { id: true, firstName: true, lastName: true, ageGroup: true, photo: true, playerType: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.player.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, ageGroup: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  return { awards, players };
}

export default async function BestPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) redirect("/dashboard/access-denied");

  const params = await searchParams;
  const now = new Date();
  const month = parseInt(params.month ?? String(now.getMonth() + 1));
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const { awards, players } = await getData(month, year);

  const usedCategories = awards.map((a) => a.category);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Best Players of the Month" subtitle={`${MONTH_NAMES[month - 1]} ${year}`} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <BestPlayersContent
          awards={awards.map((a) => ({
            id: a.id,
            category: a.category,
            reason: a.reason,
            achievement: a.achievement,
            player: {
              firstName: a.player.firstName,
              lastName: a.player.lastName,
              ageGroup: a.player.ageGroup,
              playerType: a.player.playerType,
              photo: a.player.photo,
            },
          }))}
          month={month}
          year={year}
          monthNames={MONTH_NAMES}
        />

        {/* Add new award */}
        <BestPlayerForm
          players={players}
          categories={CATEGORIES.filter((c) => !usedCategories.includes(c))}
          month={month}
          year={year}
        />
      </div>
    </div>
  );
}
