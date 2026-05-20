"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AGE_GROUPS = ["U5", "U7", "U9", "U11", "U13", "U15"];

export function NewGroupFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create group.");
    } else {
      router.push("/dashboard/groups");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Create Training Group" subtitle="Set up a new group for players to join" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Group Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Group Name *</Label>
                    <Input id="name" name="name" required placeholder="e.g. Lions U9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ageGroup">Age Group *</Label>
                    <select
                      id="ageGroup"
                      name="ageGroup"
                      required
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {AGE_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g.replace("U", "Under ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxCapacity">Max Capacity *</Label>
                  <Input
                    id="maxCapacity"
                    name="maxCapacity"
                    type="number"
                    min="1"
                    max="50"
                    defaultValue="20"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Training focus, schedule notes..."
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
                    Create Group
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
