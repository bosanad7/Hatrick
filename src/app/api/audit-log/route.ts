import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const action = url.searchParams.get("action") ?? undefined;
  const entity = url.searchParams.get("entity") ?? undefined;
  const userId = url.searchParams.get("userId") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(userId ? { userId } : {}),
    ...(search
      ? {
          OR: [
            { action: { contains: search } },
            { entity: { contains: search } },
            { details: { contains: search } },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      ...l,
      details: l.details ? JSON.parse(l.details) : null,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
