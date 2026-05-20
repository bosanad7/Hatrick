"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const PITCHES = ["PITCH_1", "PITCH_2", "PITCH_3", "PITCH_4", "PITCH_5A", "PITCH_5B"] as const;
const BOOKING_TYPES = ["RENTAL", "BIRTHDAY", "EVENT"] as const;

const pitchLabel = (p: string) => p.replace("_", " ").replace("PITCH", "Pitch");

export function NewBookingFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to create booking.");
    } else {
      router.push("/dashboard/pitches");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Book a Pitch"
        subtitle="Reserve a pitch for rental, birthday or event"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Pitch & Type */}
                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="type">Booking Type *</Label>
                    <select
                      id="type"
                      name="type"
                      required
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select type</option>
                      {BOOKING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Booked By */}
                <div className="space-y-1.5">
                  <Label htmlFor="bookedBy">Booked By *</Label>
                  <Input
                    id="bookedBy"
                    name="bookedBy"
                    required
                    placeholder="Customer name or organisation"
                  />
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

                {/* Total Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="totalAmount">Total Amount (KWD)</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0.000"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Any special requirements or additional details..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm Booking
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
