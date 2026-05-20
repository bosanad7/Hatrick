"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Props {
  users: { id: string; name: string; email: string }[];
}

export function NewCoachForm({ users }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create coach.");
    } else {
      router.push("/dashboard/coaches");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User selection */}
          <div className="space-y-1.5">
            <Label htmlFor="userId">User Account *</Label>
            <select
              id="userId"
              name="userId"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
            {users.length === 0 && (
              <p className="text-xs text-amber-600">
                All existing users already have a coach profile. Create a new user account first.
              </p>
            )}
          </div>

          {/* Coach Role */}
          <div className="space-y-1.5">
            <Label htmlFor="coachRole">Coach Role *</Label>
            <select
              id="coachRole"
              name="coachRole"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ASSISTANT_COACH">Assistant Coach</option>
              <option value="HEAD_COACH">Head Coach</option>
              <option value="GOALKEEPER_COACH">Goalkeeper Coach</option>
              <option value="FITNESS_COACH">Fitness Coach</option>
            </select>
          </div>

          {/* Speciality & License */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="speciality">Speciality</Label>
              <Input
                id="speciality"
                name="speciality"
                placeholder="e.g. Defending, Finishing"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licenseNo">License No.</Label>
              <Input
                id="licenseNo"
                name="licenseNo"
                placeholder="UEFA-B-12345"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Brief background and experience..."
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
              Add Coach
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
