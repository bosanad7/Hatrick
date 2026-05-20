"use client";

import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, FileText, Clock } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; role: string | null } | null;
}

interface AuditLogContentProps {
  logs: AuditLogEntry[];
  total: number;
  totalPages: number;
  page: number;
  search?: string;
  actionLabels: Record<string, string>;
}

const entityColors: Record<string, string> = {
  Player: "rgba(255,255,255,0.1)",
  Subscription: "rgba(255,255,255,0.08)",
  Coupon: "rgba(255,255,255,0.06)",
  Ticket: "rgba(255,255,255,0.05)",
  Merchandise: "rgba(255,255,255,0.04)",
  BestPlayerOfMonth: "rgba(255,255,255,0.03)",
};

export function AuditLogContent({
  logs,
  total,
  totalPages,
  page,
  search,
  actionLabels,
}: AuditLogContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form className="flex gap-3">
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder={t("search_actions")}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <button
              type="submit"
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {t("search")}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Log entries */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {t("no_audit_entries")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const details = log.details ? JSON.parse(log.details) : null;
            return (
              <Card key={log.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: entityColors[log.entity] ?? "rgba(255,255,255,0.05)" }}
                  >
                    <FileText className="h-4 w-4" style={{ color: "var(--foreground)" }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {actionLabels[log.action] ?? log.action}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {log.entity}
                          </Badge>
                          {log.entityId && (
                            <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                              {log.entityId.slice(0, 12)}...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* User info */}
                    <div className="mt-2 flex items-center gap-2">
                      <User className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {log.user?.name ?? t("unknown")} ({log.user?.role ?? "—"})
                      </span>
                    </div>

                    {/* Details */}
                    {details && (
                      <div
                        className="mt-2 rounded-md p-2 text-[11px] font-mono"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                      >
                        {Object.entries(details)
                          .slice(0, 5)
                          .map(([k, v]) => (
                            <div key={k}>
                              <span style={{ color: "var(--foreground)" }}>{k}</span>: {String(v)}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <a
              href={`/dashboard/admin/audit-log?page=${page - 1}${search ? `&search=${search}` : ""}`}
              className="rounded-md border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {t("previous")}
            </a>
          )}
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {t("page_of", { current: page, total: totalPages })}
          </span>
          {page < totalPages && (
            <a
              href={`/dashboard/admin/audit-log?page=${page + 1}${search ? `&search=${search}` : ""}`}
              className="rounded-md border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {t("next")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
