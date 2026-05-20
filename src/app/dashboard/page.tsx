import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/permissions";
import { Role } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  redirect(getDashboardPath(role));
}
