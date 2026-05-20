import { Role } from "@prisma/client";

// ─── Permission map ────────────────────────────────────────────────────────────
// Each key lists which roles are allowed to perform that action.

/**
 * Central permission map for the Hattrick academy platform.
 *
 * Each key represents a named capability. Its value is the array of `Role`s
 * that are allowed to exercise that capability.  Use together with `can()` for
 * runtime checks in both server components and API routes.
 *
 * Quick role summary:
 *  - ADMIN   → unrestricted access to everything
 *  - MANAGER → operational read / payment management, no mutations on core entities
 *  - COACH   → own sessions, attendance marking, notes
 *  - PARENT  → own children's data only
 */
export const PERMISSIONS = {
  // ── User / role management ──────────────────────────────────────────────────
  /** Create, update, or delete user accounts and change roles. ADMIN only. */
  MANAGE_USERS:          [Role.ADMIN] as Role[],
  /** Assign or change roles on existing users. ADMIN only. */
  MANAGE_ROLES:          [Role.ADMIN] as Role[],

  // ── Players ─────────────────────────────────────────────────────────────────
  /** List/search all players in the academy, across all groups. ADMIN + MANAGER. */
  VIEW_ALL_PLAYERS:      [Role.ADMIN, Role.MANAGER] as Role[],
  /** Create, edit, or archive player profiles. ADMIN only. */
  MANAGE_PLAYERS:        [Role.ADMIN] as Role[],
  /** View the children linked to the authenticated parent account. ADMIN + PARENT. */
  VIEW_OWN_CHILDREN:     [Role.ADMIN, Role.PARENT] as Role[],

  // ── Coaches ─────────────────────────────────────────────────────────────────
  /** List all coaches on staff. ADMIN + MANAGER. */
  VIEW_ALL_COACHES:      [Role.ADMIN, Role.MANAGER] as Role[],
  /** Create, edit, or remove coach profiles. ADMIN only. */
  MANAGE_COACHES:        [Role.ADMIN] as Role[],

  // ── Groups ──────────────────────────────────────────────────────────────────
  /** View the complete list of training groups. ADMIN + MANAGER. */
  VIEW_ALL_GROUPS:       [Role.ADMIN, Role.MANAGER] as Role[],
  /**
   * View groups the user is assigned to (coaches see their own groups;
   * admin/manager see all). ADMIN + MANAGER + COACH.
   */
  VIEW_ASSIGNED_GROUPS:  [Role.ADMIN, Role.MANAGER, Role.COACH] as Role[],
  /** Create, edit, or delete training groups. ADMIN only. */
  MANAGE_GROUPS:         [Role.ADMIN] as Role[],

  // ── Schedule ────────────────────────────────────────────────────────────────
  /** View the full academy schedule for all groups. ADMIN + MANAGER + COACH. */
  VIEW_ALL_SCHEDULE:     [Role.ADMIN, Role.MANAGER, Role.COACH] as Role[],
  /**
   * View the session schedule relevant to the user — either all sessions
   * (staff) or sessions for the user's children (parents).
   * ADMIN + MANAGER + COACH + PARENT.
   */
  VIEW_OWN_SCHEDULE:     [Role.ADMIN, Role.MANAGER, Role.COACH, Role.PARENT] as Role[],
  /** Create, edit, or cancel training sessions. ADMIN only. */
  MANAGE_SCHEDULE:       [Role.ADMIN] as Role[],

  // ── Attendance ──────────────────────────────────────────────────────────────
  /** Record attendance for a session. ADMIN + COACH. */
  MARK_ATTENDANCE:       [Role.ADMIN, Role.COACH] as Role[],
  /** View attendance records for the whole academy. ADMIN + MANAGER. */
  VIEW_ALL_ATTENDANCE:   [Role.ADMIN, Role.MANAGER] as Role[],
  /**
   * View attendance records scoped to the current user — coaches see their
   * sessions, parents see their children. ADMIN + PARENT + COACH.
   */
  VIEW_OWN_ATTENDANCE:   [Role.ADMIN, Role.PARENT, Role.COACH] as Role[],

  // ── Pitches ─────────────────────────────────────────────────────────────────
  /** View pitch availability and booking list. ADMIN + MANAGER. */
  VIEW_PITCHES:          [Role.ADMIN, Role.MANAGER] as Role[],
  /** Create or modify pitch bookings. ADMIN only. */
  MANAGE_PITCHES:        [Role.ADMIN] as Role[],

  // ── Payments ────────────────────────────────────────────────────────────────
  /** View all payment records for every parent/player. ADMIN + MANAGER. */
  VIEW_ALL_PAYMENTS:     [Role.ADMIN, Role.MANAGER] as Role[],
  /** View payment records for the authenticated parent's own account. ADMIN + PARENT. */
  VIEW_OWN_PAYMENTS:     [Role.ADMIN, Role.PARENT] as Role[],
  /** Create payment records or mark payments as paid/overdue. ADMIN + MANAGER. */
  MANAGE_PAYMENTS:       [Role.ADMIN, Role.MANAGER] as Role[],

  // ── Reports ─────────────────────────────────────────────────────────────────
  /** Access aggregated financial and operational reports. ADMIN + MANAGER. */
  VIEW_FULL_REPORTS:     [Role.ADMIN, Role.MANAGER] as Role[],

  // ── Announcements ───────────────────────────────────────────────────────────
  /** Read announcements targeted at the user's role or everyone. All roles. */
  VIEW_ANNOUNCEMENTS:    [Role.ADMIN, Role.MANAGER, Role.COACH, Role.PARENT] as Role[],
  /** Create, edit, or pin announcements. ADMIN + MANAGER. */
  MANAGE_ANNOUNCEMENTS:  [Role.ADMIN, Role.MANAGER] as Role[],

  // ── AI Assistant ────────────────────────────────────────────────────────────
  /** Access the AI assistant chat feature. ADMIN + MANAGER. */
  USE_AI_ASSISTANT:      [Role.ADMIN, Role.MANAGER] as Role[],

  // ── Coach-specific ──────────────────────────────────────────────────────────
  /** Read coach notes / player assessments written by coaches. ADMIN + COACH. */
  VIEW_COACH_NOTES:      [Role.ADMIN, Role.COACH] as Role[],
  /** Create or edit coach notes on players. ADMIN + COACH. */
  ADD_COACH_NOTES:       [Role.ADMIN, Role.COACH] as Role[],

  // ── Subscriptions ─────────────────────────────────────────────────────────
  /** View all subscriptions in the academy. ADMIN + MANAGER. */
  VIEW_ALL_SUBSCRIPTIONS: [Role.ADMIN, Role.MANAGER] as Role[],
  /** Create, modify, freeze, cancel subscriptions. ADMIN only. */
  MANAGE_SUBSCRIPTIONS:   [Role.ADMIN] as Role[],
  /** View own subscription data. ADMIN + PARENT. */
  VIEW_OWN_SUBSCRIPTIONS: [Role.ADMIN, Role.PARENT] as Role[],

  // ── Coupons ───────────────────────────────────────────────────────────────
  /** Manage discount coupons. ADMIN only. */
  MANAGE_COUPONS:         [Role.ADMIN] as Role[],

  // ── Merchandise ───────────────────────────────────────────────────────────
  /** Manage merchandise catalog. ADMIN only. */
  MANAGE_MERCHANDISE:     [Role.ADMIN] as Role[],
  /** View merchandise for purchasing. ADMIN + PARENT. */
  VIEW_MERCHANDISE:       [Role.ADMIN, Role.PARENT] as Role[],

  // ── Tickets & Support ─────────────────────────────────────────────────────
  /** View own tickets. ADMIN + PARENT + CALL_CENTER. */
  VIEW_OWN_TICKETS:       [Role.ADMIN, Role.PARENT, Role.CALL_CENTER] as Role[],
  /** View all tickets across the platform. ADMIN + MANAGER + CALL_CENTER. */
  VIEW_ALL_TICKETS:       [Role.ADMIN, Role.MANAGER, Role.CALL_CENTER] as Role[],
  /** Reply, assign, escalate, close tickets. ADMIN + CALL_CENTER. */
  MANAGE_TICKETS:         [Role.ADMIN, Role.CALL_CENTER] as Role[],

  // ── Notifications ─────────────────────────────────────────────────────────
  /** Send platform-wide notifications. ADMIN + MANAGER. */
  SEND_NOTIFICATIONS:     [Role.ADMIN, Role.MANAGER] as Role[],

  // ── Audit Log ─────────────────────────────────────────────────────────────
  /** View audit log. ADMIN only. */
  VIEW_AUDIT_LOG:         [Role.ADMIN] as Role[],

  // ── Civil ID ──────────────────────────────────────────────────────────────
  /** View uploaded civil ID images. ADMIN only. */
  VIEW_CIVIL_ID:          [Role.ADMIN] as Role[],
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns `true` if `role` appears in the `permission` allow-list.
 *
 * Pattern — use this in both server components and API routes:
 * ```ts
 * if (!can(role, PERMISSIONS.MANAGE_PLAYERS)) {
 *   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 * }
 * ```
 *
 * @param role       The role extracted from the session token.
 * @param permission One of the `PERMISSIONS` entries (a readonly `Role[]`).
 */
export function can(role: Role, permission: readonly Role[]): boolean {
  return (permission as Role[]).includes(role);
}

/**
 * Throws an `Error` if the role is not in the permission allow-list.
 *
 * Use this in server actions and API route handlers where you want to
 * short-circuit execution with a thrown error rather than returning a response:
 *
 * ```ts
 * // In a server action:
 * const session = await auth();
 * const role = (session?.user as { role?: Role })?.role ?? Role.PARENT;
 * requirePermission(role, PERMISSIONS.MANAGE_PLAYERS);
 * // ... safe to continue
 * ```
 *
 * The caller is responsible for catching the error and converting it to an
 * appropriate HTTP response or user-facing message.
 *
 * @param role       The role extracted from the session token.
 * @param permission One of the `PERMISSIONS` entries (a readonly `Role[]`).
 * @throws {Error}   If the role is not in the permission list.
 */
export function requirePermission(role: Role, permission: readonly Role[]): void {
  if (!can(role, permission)) {
    throw new Error(`Unauthorized: role ${role} cannot perform this action`);
  }
}

/**
 * Maps a `Role` to its dedicated dashboard home path.
 *
 * Used by:
 * - **Middleware** — redirects `/dashboard` (root) to the role-specific home.
 * - **`/dashboard/access-denied`** — "Go to my dashboard" button destination.
 * - **Login page** — post-login redirect target.
 *
 * @param role The authenticated user's role.
 * @returns    An absolute path string (e.g. `"/dashboard/admin"`).
 */
export function getDashboardPath(role: Role): string {
  switch (role) {
    case Role.ADMIN:       return "/dashboard/admin";
    case Role.MANAGER:     return "/dashboard/manager";
    case Role.COACH:       return "/dashboard/coach";
    case Role.PARENT:      return "/dashboard/parent";
    case Role.CALL_CENTER: return "/dashboard/call-center";
    default:               return "/dashboard/parent";
  }
}

/** Human-readable display label for each role, used in badges and UI copy. */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]:       "Administrator",
  [Role.MANAGER]:     "Manager",
  [Role.COACH]:       "Coach",
  [Role.PARENT]:      "Parent",
  [Role.CALL_CENTER]: "Call Center",
};

/**
 * Badge colour tokens for each role.
 *
 * Both `bg` and `text` use `rgba()` values so they work in both dark and light
 * mode without needing separate CSS-variable overrides.
 *
 * Usage:
 * ```tsx
 * const { bg, text } = ROLE_COLORS[role];
 * <span style={{ background: bg, color: text }}>{ROLE_LABELS[role]}</span>
 * ```
 */
export const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  [Role.ADMIN]:       { bg: "rgba(255,255,255,0.12)",  text: "#ffffff" },
  [Role.MANAGER]:     { bg: "rgba(255,255,255,0.08)",  text: "#cccccc" },
  [Role.COACH]:       { bg: "rgba(255,255,255,0.08)",  text: "#cccccc" },
  [Role.PARENT]:      { bg: "rgba(255,255,255,0.06)",  text: "#aaaaaa" },
  [Role.CALL_CENTER]: { bg: "rgba(255,255,255,0.06)",  text: "#aaaaaa" },
};

// ─── Route → required permission ──────────────────────────────────────────────

/**
 * Route-to-role mapping consumed by `middleware.ts` at the network edge.
 *
 * How middleware uses this:
 * 1. For each incoming request to `/dashboard/*`, the middleware iterates this
 *    array in order.
 * 2. When the first matching `pattern` is found, the request's role is checked
 *    against `roles`.
 * 3. If the role is **not** in `roles`, the user is redirected to
 *    `/dashboard/access-denied?from=<pathname>` instead of the requested page.
 * 4. If no pattern matches, the request passes through (Next.js handles 404s).
 *
 * Keep patterns specific-first (longer paths before shorter ones) to avoid
 * a broad pattern shadowing a narrower one on the same prefix.
 */
export const PROTECTED_ROUTES: { pattern: RegExp; roles: Role[] }[] = [
  // Admin-only module pages (existing /dashboard/* pages)
  { pattern: /^\/dashboard\/players/,       roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/coaches/,       roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/groups/,        roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/schedule/,      roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/pitches/,       roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/payments/,      roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/reports/,       roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/announcements/, roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/ai/,            roles: [Role.ADMIN, Role.MANAGER] },
  // Role-specific dashboard areas
  { pattern: /^\/dashboard\/admin/,         roles: [Role.ADMIN] },
  { pattern: /^\/dashboard\/manager/,       roles: [Role.ADMIN, Role.MANAGER] },
  { pattern: /^\/dashboard\/coach/,         roles: [Role.ADMIN, Role.COACH] },
  { pattern: /^\/dashboard\/parent/,        roles: [Role.ADMIN, Role.PARENT] },
  { pattern: /^\/dashboard\/call-center/,  roles: [Role.ADMIN, Role.CALL_CENTER] },
];
