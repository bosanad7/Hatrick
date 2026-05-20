"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Snowflake, Play, XCircle, CalendarPlus, ArrowRightLeft, Loader2 } from "lucide-react";

interface SubscriptionActionsProps {
  subscriptionId: string;
  status: string;
  playerId: string;
}

export function SubscriptionActions({ subscriptionId, status }: SubscriptionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setLoading(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Action failed" });
      } else {
        setMessage({ type: "success", text: `${action} completed successfully` });
        // Reload page to reflect changes
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(null);
    }
  }

  const actions = [
    {
      key: "freeze",
      label: "Freeze",
      icon: Snowflake,
      show: status === "ACTIVE",
      onClick: () => doAction("freeze"),
    },
    {
      key: "unfreeze",
      label: "Unfreeze",
      icon: Play,
      show: status === "FROZEN",
      onClick: () => doAction("unfreeze"),
    },
    {
      key: "cancel",
      label: "Cancel",
      icon: XCircle,
      show: status !== "CANCELLED",
      onClick: () => {
        if (confirm("Are you sure you want to cancel this subscription?")) {
          doAction("cancel");
        }
      },
    },
    {
      key: "extend",
      label: "Extend 30 Days",
      icon: CalendarPlus,
      show: status === "ACTIVE" || status === "EXPIRED",
      onClick: () => {
        const newEnd = new Date();
        newEnd.setDate(newEnd.getDate() + 30);
        doAction("extend", { newEndDate: newEnd.toISOString(), additionalSessions: 4 });
      },
    },
    {
      key: "transfer",
      label: "Transfer",
      icon: ArrowRightLeft,
      show: status === "ACTIVE",
      onClick: () => {
        const newPlayerId = prompt("Enter new player ID:");
        if (newPlayerId) doAction("transfer", { newPlayerId });
      },
    },
  ];

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
          Actions
        </h3>

        {message && (
          <div
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: message.type === "success" ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.1)",
              color: message.type === "success" ? "var(--foreground)" : "#f87171",
            }}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {actions
            .filter((a) => a.show)
            .map(({ key, label, icon: Icon, onClick }) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={onClick}
                disabled={loading !== null}
              >
                {loading === key ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {label}
              </Button>
            ))}
        </div>

        {actions.filter((a) => a.show).length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No actions available for this subscription status.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
