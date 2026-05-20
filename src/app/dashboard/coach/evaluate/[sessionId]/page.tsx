import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { EvaluationForm } from "@/components/coach/evaluation-form";

async function getSessionData(sessionId: string, userId: string) {
  const coach = await db.coach.findUnique({ where: { userId } });
  if (!coach) return null;

  const trainingSession = await db.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      group: {
        include: {
          groupPlayers: {
            include: {
              player: {
                include: {
                  subscriptions: {
                    where: { status: "ACTIVE" },
                    orderBy: { endDate: "desc" },
                    take: 1,
                  },
                  postponements: {
                    where: { sessionId },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
      evaluations: {
        where: { coachId: coach.id },
        include: { player: true },
      },
    },
  });

  if (!trainingSession) return null;

  // Get players with their status enrichments
  const players = trainingSession.group.groupPlayers.map((gp) => {
    const player = gp.player;
    const activeSub = player.subscriptions[0];
    const postponement = player.postponements[0];

    // Determine visual status
    let statusTag: "active" | "postponed" | "last-session" | "expired" | "trial" = "active";
    if (postponement && postponement.status === "APPROVED") {
      statusTag = "postponed";
    } else if (activeSub) {
      if (activeSub.type === "TRIAL_SESSION") {
        statusTag = "trial";
      } else if (activeSub.totalSessions && activeSub.usedSessions >= (activeSub.totalSessions - 1)) {
        statusTag = "last-session";
      } else if (activeSub.status === "EXPIRED") {
        statusTag = "expired";
      }
    } else {
      statusTag = "expired"; // No active subscription
    }

    // Check for existing evaluation
    const existingEval = trainingSession.evaluations.find(
      (e) => e.playerId === player.id
    );

    return {
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      ageGroup: player.ageGroup,
      playerType: player.playerType,
      jerseyNumber: player.jerseyNumber,
      statusTag,
      existingEval: existingEval
        ? {
            attendance: existingEval.attendance,
            discipline: existingEval.discipline,
            technical: existingEval.technical,
            tactical: existingEval.tactical,
            fitness: existingEval.fitness,
            teamwork: existingEval.teamwork,
            notes: existingEval.notes,
            recommendation: existingEval.recommendation,
          }
        : null,
    };
  });

  // Sort: active first, postponed at bottom
  players.sort((a, b) => {
    const order = { active: 0, trial: 1, "last-session": 2, expired: 3, postponed: 4 };
    return (order[a.statusTag] ?? 0) - (order[b.statusTag] ?? 0);
  });

  return {
    sessionId: trainingSession.id,
    title: trainingSession.title,
    groupName: trainingSession.group.name,
    startTime: trainingSession.startTime,
    endTime: trainingSession.endTime,
    pitch: trainingSession.pitch,
    players,
    hasExistingEvals: trainingSession.evaluations.length > 0,
  };
}

export default async function SessionEvaluationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.COACH] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { sessionId } = await params;
  const data = userId ? await getSessionData(sessionId, userId) : null;
  if (!data) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title={`Evaluate: ${data.title}`}
        subtitle={`${data.groupName} · ${data.pitch.replace("_", " ")} · ${data.players.length} players`}
      />
      <div className="flex-1 overflow-auto p-6">
        <EvaluationForm
          sessionId={data.sessionId}
          sessionTitle={data.title}
          groupName={data.groupName}
          players={data.players}
          hasExistingEvals={data.hasExistingEvals}
        />
      </div>
    </div>
  );
}
