"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

export function CreateTicketForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: fd.get("category"),
          priority: "MEDIUM",
          subject: fd.get("subject"),
          body: fd.get("body"),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create ticket");
      } else {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Support Ticket
      </Button>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Ticket submitted successfully! Our team will respond shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
          New Support Ticket
        </h3>

        {error && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <select name="category" required
                className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="QUESTION">Question</option>
                <option value="HELP">Help</option>
                <option value="SUGGESTION">Suggestion</option>
                <option value="COMPLAINT">Complaint</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input name="subject" placeholder="Brief description..." required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <textarea name="body" rows={4} required placeholder="Describe your issue or question..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
