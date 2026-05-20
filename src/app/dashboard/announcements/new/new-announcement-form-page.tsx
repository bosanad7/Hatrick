"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function NewAnnouncementFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title"),
      body: form.get("body"),
      target: form.get("target"),
      pinned: form.get("pinned") === "on",
    };

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to post announcement.");
    } else {
      router.push("/dashboard/announcements");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="New Announcement" subtitle="Broadcast a message to your audience" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="e.g. Academy closed on National Day"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="body">Message *</Label>
                  <textarea
                    id="body"
                    name="body"
                    rows={6}
                    required
                    placeholder="Write your announcement here..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="target">Audience *</Label>
                    <select
                      id="target"
                      name="target"
                      required
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="ALL">Everyone</option>
                      <option value="PARENTS">Parents Only</option>
                      <option value="COACHES">Coaches Only</option>
                      <option value="ADMINS">Admins Only</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 h-10">
                    <input
                      id="pinned"
                      name="pinned"
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-foreground focus:ring-ring"
                    />
                    <Label htmlFor="pinned" className="cursor-pointer">
                      Pin this announcement
                    </Label>
                  </div>
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
                    Post Announcement
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
