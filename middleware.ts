/**
 * Next.js middleware — runs in the Edge Runtime on every matching request.
 *
 * Uses NextAuth v5 split-config pattern with authConfig (no Prisma).
 * The auth() callback adds req.auth with the decoded JWT session.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "ADMIN" | "MANAGER" | "COACH" | "PARENT" | "CALL_CENTER";

function getDashboardPath(role: Role): string {
  switch (role) {
    case "ADMIN":       return "/dashboard/admin";
    case "MANAGER":     return "/dashboard/manager";
    case "COACH":       return "/dashboard/coach";
    case "PARENT":      return "/dashboard/parent";
    case "CALL_CENTER": return "/dashboard/call-center";
    default:            return "/dashboard/parent";
  }
}

// Route → allowed roles
const PROTECTED_ROUTES: { pattern: RegExp; roles: Role[] }[] = [
  { pattern: /^\/dashboard\/subscriptions/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/coupons/,       roles: ["ADMIN"] },
  { pattern: /^\/dashboard\/merchandise/,   roles: ["ADMIN"] },
  { pattern: /^\/dashboard\/registration/,  roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/tickets/,       roles: ["ADMIN", "CALL_CENTER"] },
  { pattern: /^\/dashboard\/players/,       roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/coaches/,       roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/groups/,        roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/schedule/,      roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/pitches/,       roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/payments/,      roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/reports/,       roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/announcements/, roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/ai/,            roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/admin/,         roles: ["ADMIN"] },
  { pattern: /^\/dashboard\/manager/,       roles: ["ADMIN", "MANAGER"] },
  { pattern: /^\/dashboard\/coach/,         roles: ["ADMIN", "COACH"] },
  { pattern: /^\/dashboard\/parent/,        roles: ["ADMIN", "PARENT"] },
  { pattern: /^\/dashboard\/call-center/,   roles: ["ADMIN", "CALL_CENTER"] },
];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuthenticated = !!session?.user;
  const role = ((session?.user as { role?: string } | undefined)?.role ?? "PARENT") as Role;

  // Redirect authenticated users away from /login
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  // Protect all /dashboard/* routes
  if (pathname.startsWith("/dashboard")) {
    // Unauthenticated → login
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // /dashboard root → role home
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }

    // Let access-denied and notifications pages through
    if (pathname.startsWith("/dashboard/access-denied") || pathname.startsWith("/dashboard/notifications")) {
      return NextResponse.next();
    }

    // Role-based route protection
    for (const { pattern, roles } of PROTECTED_ROUTES) {
      if (pattern.test(pathname)) {
        if (!roles.includes(role)) {
          const url = new URL("/dashboard/access-denied", req.url);
          url.searchParams.set("from", pathname);
          return NextResponse.redirect(url);
        }
        break;
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
