"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function CouponForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      code: fd.get("code"),
      type: fd.get("type"),
      value: fd.get("value"),
      maxUses: fd.get("maxUses") || null,
      minPlayers: fd.get("minPlayers") || "1",
      validFrom: fd.get("validFrom"),
      validUntil: fd.get("validUntil"),
    };

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create coupon");
        return;
      }

      router.push("/dashboard/coupons");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input id="code" name="code" placeholder="HATTRICK10" required className="uppercase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (KWD)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" step="0.01" min="0" placeholder="10" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input id="maxUses" name="maxUses" type="number" min="1" placeholder="Unlimited" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minPlayers">Min Players</Label>
              <Input id="minPlayers" name="minPlayers" type="number" min="1" defaultValue="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input id="validFrom" name="validFrom" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input id="validUntil" name="validUntil" type="date" required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Coupon
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
