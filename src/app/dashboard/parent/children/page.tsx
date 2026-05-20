import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAge, formatDate } from "@/lib/utils";
import { T } from "@/components/t";

async function getChildren(userId: string) {
  try {
    const parent = await db.parent.findUnique({ where: { userId } });
    if (!parent) return [];
    return await db.player.findMany({ where: { parentId: parent.id }, orderBy: { firstName: "asc" } });
  } catch { return []; }
}

export default async function ParentChildrenPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.PARENT] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const children = userId ? await getChildren(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="My Children" subtitle={`${children.length} child${children.length !== 1 ? "ren" : ""} registered`} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {children.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--muted-foreground)]"><T k="no_data" /></p>
          </div>
        ) : children.map((c) => (
          <Card key={c.id} className="card-brand">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)] text-xl font-bold text-white shrink-0">
                  {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                      {c.firstName} {c.lastName}
                    </h3>
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
                    {c.jerseyNumber && (
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>#{c.jerseyNumber}</span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    {[
                      { tKey: "age_group" as const, value: c.ageGroup },
                      { tKey: "age" as const,       value: `${getAge(c.dateOfBirth)} ${c.ageGroup ? "yrs" : ""}` },
                      { tKey: "position" as const,  value: c.position ?? "—" },
                      { tKey: "enrollment_date" as const, value: formatDate(c.enrollmentDate) },
                    ].map((f) => (
                      <div key={f.tKey}>
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}><T k={f.tKey} /></p>
                        <p className="mt-0.5 font-medium" style={{ color: "var(--foreground)" }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link href={`/dashboard/parent/children/${c.id}`}>
                    <Button variant="outline" size="sm"><T k="view_profile_stats" /></Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
