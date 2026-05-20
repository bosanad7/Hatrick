"use client";

import { useTranslation } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pin } from "lucide-react";
import Link from "next/link";
import type { AudienceTarget } from "@prisma/client";

const targetColors: Record<string, string> = {
  ALL: "default",
  PARENTS: "secondary",
  COACHES: "outline",
  ADMINS: "warning",
  CALL_CENTER_STAFF: "outline",
};

const targetKey: Record<string, string> = {
  ALL: "target_all",
  PARENTS: "target_parents",
  COACHES: "target_coaches",
  ADMINS: "target_admins",
  CALL_CENTER_STAFF: "target_call_center",
};

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  target: AudienceTarget;
  pinned: boolean;
  createdAt: string;
}

interface AnnouncementsClientProps {
  announcements: AnnouncementRow[];
  pinnedCount: number;
}

export function AnnouncementsClient({ announcements, pinnedCount }: AnnouncementsClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Announcements"
        subtitle={t("announcements_count", { total: announcements.length, pinned: pinnedCount })}
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("announcements_subtitle")}
          </p>
          <Button asChild>
            <Link href="/dashboard/announcements/new">
              <Plus className="h-4 w-4" />
              {t("new_announcement")}
            </Link>
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">{t("title")}</th>
                    <th className="px-4 py-3">{t("audience")}</th>
                    <th className="px-4 py-3">{t("pinned")}</th>
                    <th className="px-4 py-3">{t("created")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                        {t("no_announcements")}
                      </td>
                    </tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr
                        key={ann.id}
                        className={`hover:bg-[rgba(255,255,255,0.02)] transition-colors ${
                          ann.pinned ? "bg-[rgba(245,158,11,0.05)]" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {ann.pinned && (
                              <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-[var(--foreground)]">{ann.title}</p>
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)] max-w-sm truncate">
                                {ann.body}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              targetColors[ann.target] as
                                | "default"
                                | "secondary"
                                | "outline"
                                | "warning"
                                | "destructive"
                            }
                          >
                            {t((targetKey[ann.target] ?? ann.target) as any)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {ann.pinned ? (
                            <Badge variant="warning">{t("pinned")}</Badge>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {ann.createdAt}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
