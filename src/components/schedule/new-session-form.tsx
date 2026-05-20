"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Group {
  id: string;
  name: string;
  ageGroup: string;
}

interface Coach {
  id: string;
  name: string;
  coachRole: string;
}

interface Props {
  groups: Group[];
  coaches: Coach[];
}

const PITCHES = ["PITCH_1", "PITCH_2", "PITCH_3", "PITCH_4", "PITCH_5A", "PITCH_5B"] as const;

const pitchLabel = (p: string) => p.replace("_", " ").replace("PITCH", "Pitch");

const coachRoleLabel = (role: string) =>
  role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function NewSessionForm({ groups, coaches }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create session.");
    } else {
      router.push("/dashboard/schedule");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. U11 Tuesday Training"
            />
          </div>

          {/* Group & Coach */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="groupId">Group *</Label>
              <select
                id="groupId"
                name="groupId"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.ageGroup.replace("U", "U-")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coachId">Coach *</Label>
              <select
                id="coachId"
                name="coachId"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select coach</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {coachRoleLabel(c.coachRole)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-1.5">
            <Label htmlFor="pitch">Pitch *</Label>
            <select
              id="pitch"
              name="pitch"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select pitch</option>
              {PITCHES.map((p) => (
                <option key={p} value={p}>
                  {pitchLabel(p)}
                  {["PITCH_5A", "PITCH_5B"].includes(p) ? " (5-a-side)" : " (FIFA-quality)"}
                </option>
              ))}
            </select>
          </div>

          {/* Start & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any additional notes about this session..."
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
              Schedule Session
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
