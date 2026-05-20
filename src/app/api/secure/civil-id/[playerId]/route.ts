import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * Secure civil ID image endpoint.
 * Only ADMIN users can view civil ID images.
 * Images are stored outside /public to prevent direct URL access.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;

  // Only admins can view civil IDs
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
  }

  const { playerId } = await params;

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { civilIdImage: true, firstName: true, lastName: true },
  });

  if (!player || !player.civilIdImage) {
    return NextResponse.json({ error: "Civil ID image not found" }, { status: 404 });
  }

  // Civil ID images stored in a secure directory outside public
  const imagePath = path.resolve(process.cwd(), "secure-uploads", player.civilIdImage);

  if (!existsSync(imagePath)) {
    return NextResponse.json({ error: "Image file not found on disk" }, { status: 404 });
  }

  try {
    const buffer = await readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="civil-id-${player.firstName}-${player.lastName}${ext}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read image" }, { status: 500 });
  }
}
