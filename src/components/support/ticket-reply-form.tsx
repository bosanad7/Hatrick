"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Lock, CheckCircle } from "lucide-react";

interface TicketReplyFormProps {
  ticketId: string;
  ticketStatus: string;
}

export function TicketReplyForm({ ticketId, ticketStatus }: TicketReplyFormProps) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isInternal }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to send reply");
      } else {
        setBody("");
        window.location.reload();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve() {
    setResolving(true);
    try {
      await fetch(`/api/tickets/${ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: "Ticket resolved.",
          isInternal: true,
        }),
      });
      // TODO: Add a dedicated resolve endpoint
      window.location.reload();
    } catch {
      setError("Failed to resolve");
    } finally {
      setResolving(false);
    }
  }

  if (ticketStatus === "CLOSED" || ticketStatus === "RESOLVED") {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <CheckCircle className="mx-auto mb-2 h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            This ticket has been {ticketStatus.toLowerCase()}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        {error && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleReply} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Type your reply..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <Lock className="h-3 w-3" /> Internal note (not visible to parent)
              </span>
            </label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                <CheckCircle className="mr-1 h-3 w-3" /> Resolve
              </Button>
              <Button type="submit" size="sm" disabled={loading || !body.trim()}>
                {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                <Send className="mr-1 h-3 w-3" /> Reply
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
