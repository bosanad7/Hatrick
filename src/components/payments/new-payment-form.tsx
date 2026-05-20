"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
  parentId: string;
}

interface Props {
  players: Player[];
}

const PAYMENT_TYPES = [
  "REGISTRATION",
  "MONTHLY",
  "TERM",
  "ANNUAL",
  "EVENT",
  "RENTAL",
] as const;

export function NewPaymentForm({ players }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to record payment.");
    } else {
      router.push("/dashboard/payments");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="playerId">Player</Label>
            <select
              id="playerId"
              name="playerId"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select player (optional)</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">Payment Type *</Label>
            <select
              id="type"
              name="type"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select type</option>
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (KWD) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.001"
                min="0"
                required
                placeholder="0.000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any additional notes..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
