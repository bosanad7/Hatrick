import { Header } from "@/components/layout/header";
import { AIAssistantClient } from "./ai-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function AIPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="AI Assistant" subtitle="Ask anything about your academy" />
      <AIAssistantClient />
    </div>
  );
}
