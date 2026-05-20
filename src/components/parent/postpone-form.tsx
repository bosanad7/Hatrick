"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Clock } from "lucide-react";

interface PostponeFormProps {
  children: { id: string; name: string; remaining: number }[];
  sessions: { id: string; title: string; date: string }[];
}

export function PostponeForm({ children, sessions }: PostponeFormProps) {
  const [playerId, setPlayerId] = useState(children[0]?.id ?? "");
  const [sessionId, setSessionId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = children.find((c) => c.id === playerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !sessionId) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/postponements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, sessionId, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Failed to request postponement" });
      } else {
        setMessage({ type: "success", text: "Postponement approved successfully!" });
        setSessionId("");
        setReason("");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" style={{ color: "var(--foreground)" }} />
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
            Request Postponement
          </h3>
        </div>

        {message && (
          <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{
            background: message.type === "success" ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.1)",
            color: message.type === "success" ? "var(--foreground)" : "#f87171",
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Player</Label>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.remaining} remaining)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select session...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Reason for postponement..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            {selected && (
              <p className="text-xs" style={{ color: selected.remaining > 0 ? "var(--muted-foreground)" : "#f87171" }}>
                {selected.remaining > 0
                  ? `${selected.remaining} postponement${selected.remaining !== 1 ? "s" : ""} remaining`
                  : "No postponements remaining"}
              </p>
            )}
            <Button type="submit" disabled={loading || !sessionId || (selected?.remaining ?? 0) <= 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Postponement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
