/**
 * Edge-compatible NextAuth config — no Prisma adapter, no Node.js-only imports.
 *
 * Used by middleware.ts (Edge Runtime). The full config with PrismaAdapter
 * lives in auth.ts and is used by server components / API routes.
 *
 * In NextAuth v5 with Prisma, this "split config" pattern is required because
 * PrismaClient cannot run in the Edge Runtime.
 */
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Providers list must exist (even if empty) for edge compatibility.
  // We include a no-op Credentials provider so NextAuth doesn't throw.
  providers: [
    Credentials({
      credentials: {},
      authorize: () => null,   // Auth happens in auth.ts — not here
    }),
  ],
  callbacks: {
    // Propagate custom fields from JWT token → session so req.auth.user.role works
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id     = token.id   as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
