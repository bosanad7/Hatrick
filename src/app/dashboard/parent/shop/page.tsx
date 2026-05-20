import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ShoppingBag } from "lucide-react";
import { T } from "@/components/t";

async function getMerchandise() {
  try {
    return await db.merchandise.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { category: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function ParentShopPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.PARENT] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const items = await getMerchandise();

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Academy Shop" subtitle="Browse merchandise & academy gear" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                <T k="no_merchandise_available" />
              </p>
            </CardContent>
          </Card>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                {cat}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Product image placeholder */}
                        <div className="flex h-32 items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <Package className="h-10 w-10" style={{ color: "rgba(255,255,255,0.15)" }} />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{item.name}</p>
                              {item.description && (
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.description}</p>
                              )}
                            </div>
                            <p className="text-sm font-bold shrink-0" style={{ color: "var(--foreground)" }}>
                              {item.price} KWD
                            </p>
                          </div>
                          {item.sizes && (
                            <div className="flex flex-wrap gap-1">
                              {item.sizes.split(",").map((s) => (
                                <span key={s} className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground)" }}>
                                  {s.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {item.stock > 10 ? <T k="stock" /> : `${item.stock}`}
                            </Badge>
                            <Button size="sm" variant="outline" className="text-xs">
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
