"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Props {
  parents: { id: string; name: string }[];
}

export function NewPlayerForm({ parents }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create player.");
    } else {
      router.push("/dashboard/players");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" name="firstName" required placeholder="Ahmed" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" name="lastName" required placeholder="Al-Rashidi" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                name="gender"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ageGroup">Age Group *</Label>
              <select
                id="ageGroup"
                name="ageGroup"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {["U5", "U7", "U9", "U11", "U13", "U15"].map((g) => (
                  <option key={g} value={g}>{g.replace("U", "Under ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" name="nationality" placeholder="Kuwaiti" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <select
                id="position"
                name="position"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select position</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input id="jerseyNumber" name="jerseyNumber" type="number" min="1" max="99" placeholder="10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parentId">Parent / Guardian *</Label>
            <select
              id="parentId"
              name="parentId"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select parent</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <textarea
              id="medicalNotes"
              name="medicalNotes"
              rows={3}
              placeholder="Allergies, conditions, medications..."
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
              Register Player
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
