import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { NewGroupFormPage } from "./new-group-form-page";

export default async function NewGroupPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  return <NewGroupFormPage />;
}
