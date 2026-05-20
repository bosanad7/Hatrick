"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";

export function ParentReplyForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setBody("");
        window.location.reload();
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write a reply..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={loading || !body.trim()}>
              {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              <Send className="mr-1 h-3 w-3" /> Reply
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
