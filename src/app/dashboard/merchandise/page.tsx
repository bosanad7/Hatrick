import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { MerchandiseManager } from "@/components/admin/merchandise-form";
import { T } from "@/components/ui/translated-text";

async function getMerchandise() {
  try {
    return await db.merchandise.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orderItems: true } } },
    });
  } catch {
    return [];
  }
}

export default async function MerchandisePage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    redirect("/dashboard/access-denied");
  }

  const items = await getMerchandise();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Merchandise" subtitle={`${items.length} items in catalog`} />

      <div className="flex-1 overflow-auto p-6">
        <MerchandiseManager
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            category: i.category,
            price: i.price,
            stock: i.stock,
            sizes: i.sizes,
            isActive: i.isActive,
            image: i.image,
          }))}
        />
      </div>
    </div>
  );
}
