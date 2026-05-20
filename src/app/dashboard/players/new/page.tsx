import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { NewPlayerForm } from "@/components/players/new-player-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function NewPlayerPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  let parents: { id: string; user: { name: string | null; email: string } }[] = [];
  try {
    parents = await db.parent.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    });
  } catch { /* db not ready */ }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Add New Player" subtitle="Register a new player to the academy" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <NewPlayerForm parents={parents.map((p) => ({ id: p.id, name: p.user.name ?? p.user.email ?? p.id }))} />
        </div>
      </div>
    </div>
  );
}
