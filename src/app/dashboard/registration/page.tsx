import { Header } from "@/components/layout/header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import { ShareRegistrationLink } from "@/components/registration/share-link";

export default async function RegistrationPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Player Registration" subtitle="Register new players with smart pricing" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ShareRegistrationLink />
        <RegistrationWizard />
      </div>
    </div>
  );
}
