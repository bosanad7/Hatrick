import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/permissions";
import { Role } from "@prisma/client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const userName = session.user.name ?? session.user.email ?? undefined;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} userName={userName} />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
