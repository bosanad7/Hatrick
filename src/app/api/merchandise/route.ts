import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role, MerchandiseCategory } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const category = url.searchParams.get("category") as MerchandiseCategory | null;
  const activeOnly = url.searchParams.get("active") !== "false";

  const items = await db.merchandise.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(activeOnly ? { isActive: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orderItems: true } },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session!.user as { id?: string }).id ?? "";
  const body = await req.json();
  const { name, description, category, price, stock, image, sizes, isActive } = body;

  if (!name || !category || price == null) {
    return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 });
  }

  const item = await db.merchandise.create({
    data: {
      name,
      description: description ?? null,
      category,
      price: parseFloat(price),
      stock: parseInt(stock ?? "0"),
      image: image ?? null,
      sizes: sizes ?? null,
      isActive: isActive !== false,
    },
  });

  await logAudit({
    userId,
    action: "CREATE_MERCHANDISE",
    entity: "Merchandise",
    entityId: item.id,
    details: { name, category, price },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session!.user as { id?: string }).id ?? "";
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  if (data.price != null) data.price = parseFloat(data.price);
  if (data.stock != null) data.stock = parseInt(data.stock);

  const item = await db.merchandise.update({
    where: { id },
    data,
  });

  await logAudit({
    userId,
    action: "UPDATE_MERCHANDISE",
    entity: "Merchandise",
    entityId: id,
    details: data,
  });

  return NextResponse.json({ item });
}
