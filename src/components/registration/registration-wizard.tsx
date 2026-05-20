"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight, ChevronLeft, Check, Loader2,
  User, Shield, Shirt, CreditCard, Tag, Plus, Trash2,
} from "lucide-react";
import { calculateBatchPricing, applyCoupon, formatKWD, tierLabel } from "@/lib/pricing";
import type { PricingResult } from "@/lib/pricing";

/* ── Types ───────────────────────────────────────────────────────────────────── */

type SubType = "NEW_MEMBERSHIP" | "RENEWAL" | "SINGLE_SESSION" | "TRIAL_SESSION";

interface PlayerEntry {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  playerType: "OUTFIELD" | "GOALKEEPER";
  position: string;
  subType: SubType;
  clothingSize: string;
  preferredShirtName: string;
  preferredShirtNumber: string;
}

const STEPS = [
  { key: "parent", label: "Parent", icon: User },
  { key: "players", label: "Players", icon: Shield },
  { key: "clothing", label: "Clothing", icon: Shirt },
  { key: "pricing", label: "Pricing", icon: CreditCard },
  { key: "review", label: "Review", icon: Check },
] as const;

const AGE_GROUPS = ["U5", "U7", "U9", "U11", "U13", "U15", "U17", "U19", "ADULT"];

function getAutoAgeGroup(dob: string): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  for (const g of AGE_GROUPS) {
    if (g === "ADULT") return "ADULT";
    const limit = parseInt(g.replace("U", ""));
    if (age < limit) return g;
  }
  return "ADULT";
}

function emptyPlayer(): PlayerEntry {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "MALE",
    playerType: "OUTFIELD",
    position: "",
    subType: "NEW_MEMBERSHIP",
    clothingSize: "M",
    preferredShirtName: "",
    preferredShirtNumber: "",
  };
}

/* ── Wizard ──────────────────────────────────────────────────────────────────── */

export function RegistrationWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Parent
  const [parentEmail, setParentEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAddress, setParentAddress] = useState("");

  // Players
  const [players, setPlayers] = useState<PlayerEntry[]>([emptyPlayer()]);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    discountPerPlayer: number;
    couponId?: string;
    error?: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Pricing
  const pricing = calculateBatchPricing(
    players.map((p) => ({ type: p.subType })),
    couponResult?.valid ? couponResult.discountPerPlayer : 0
  );

  const updatePlayer = useCallback((idx: number, patch: Partial<PlayerEntry>) => {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }, []);

  const addPlayer = () => setPlayers((prev) => [...prev, emptyPlayer()]);
  const removePlayer = (idx: number) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((_, i) => i !== idx));
    setCouponResult(null); // Re-validate coupon after player change
  };

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, playerCount: players.length }),
      });
      const data = await res.json();
      setCouponResult(data);
    } catch {
      setCouponResult({ valid: false, discountPerPlayer: 0, error: "Network error" });
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      // 1. Create or find parent
      const parentRes = await fetch("/api/players", { method: "GET" }); // just to test auth
      if (!parentRes.ok) {
        setError("Authentication error. Please refresh.");
        return;
      }

      // For simplicity, we'll create each player + subscription via API
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const ageGroup = getAutoAgeGroup(p.dateOfBirth);
        const pr = pricing.items[i];

        // Create player via API
        const playerRes = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            ageGroup,
            playerType: p.playerType,
            position: p.position || null,
            clothingSize: p.clothingSize,
            preferredShirtName: p.preferredShirtName || p.firstName.toUpperCase(),
            preferredShirtNumber: p.preferredShirtNumber ? parseInt(p.preferredShirtNumber) : null,
            parentId: "LOOKUP", // API will need parent lookup
            parentEmail,
            parentName,
            parentPhone,
            parentAddress,
          }),
        });

        if (!playerRes.ok) {
          const err = await playerRes.json();
          setError(err.error || `Failed to create player ${p.firstName}`);
          return;
        }

        const playerData = await playerRes.json();

        // Create subscription
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 10); // ~season

        const subRes = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: playerData.id,
            parentId: playerData.parentId,
            type: p.subType,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            totalSessions: p.subType === "SINGLE_SESSION" ? 1 : p.subType === "TRIAL_SESSION" ? 1 : 40,
            amount: pr.finalPrice,
            discount: pr.discount + pr.couponDiscount,
            couponId: couponResult?.couponId || null,
          }),
        });

        if (!subRes.ok) {
          const err = await subRes.json();
          setError(err.error || `Failed to create subscription for ${p.firstName}`);
          return;
        }
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!parentName && !!parentEmail && !!parentPhone;
      case 1: return players.every((p) => p.firstName && p.lastName && p.dateOfBirth);
      case 2: return true; // Clothing is optional
      case 3: return true; // Pricing auto-calculated
      default: return true;
    }
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Check className="h-8 w-8" style={{ color: "var(--foreground)" }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Registration Complete</h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {players.length} player{players.length > 1 ? "s" : ""} registered successfully. Total: {formatKWD(pricing.grandTotal)}
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => { setSuccess(false); setStep(0); setPlayers([emptyPlayer()]); setCouponResult(null); }}>
              Register Another
            </Button>
            <Button onClick={() => window.location.href = "/dashboard/subscriptions"}>
              View Subscriptions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: active ? "var(--primary)" : done ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "var(--primary-foreground)" : done ? "var(--foreground)" : "var(--muted-foreground)",
                  cursor: i <= step ? "pointer" : "default",
                }}
              >
                {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="mx-1 h-px w-6" style={{ background: i < step ? "var(--foreground)" : "var(--border)" }} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <StepParent
              parentName={parentName} setParentName={setParentName}
              parentEmail={parentEmail} setParentEmail={setParentEmail}
              parentPhone={parentPhone} setParentPhone={setParentPhone}
              parentAddress={parentAddress} setParentAddress={setParentAddress}
            />
          )}

          {step === 1 && (
            <StepPlayers
              players={players}
              updatePlayer={updatePlayer}
              addPlayer={addPlayer}
              removePlayer={removePlayer}
            />
          )}

          {step === 2 && (
            <StepClothing players={players} updatePlayer={updatePlayer} />
          )}

          {step === 3 && (
            <StepPricing
              pricing={pricing}
              players={players}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              couponResult={couponResult}
              validateCoupon={validateCoupon}
              validatingCoupon={validatingCoupon}
            />
          )}

          {step === 4 && (
            <StepReview
              parentName={parentName}
              parentEmail={parentEmail}
              parentPhone={parentPhone}
              players={players}
              pricing={pricing}
              couponResult={couponResult}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => { setError(null); setStep(step + 1); }} disabled={!canAdvance()}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Registration
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Step Components ─────────────────────────────────────────────────────────── */

function StepParent({
  parentName, setParentName,
  parentEmail, setParentEmail,
  parentPhone, setParentPhone,
  parentAddress, setParentAddress,
}: {
  parentName: string; setParentName: (v: string) => void;
  parentEmail: string; setParentEmail: (v: string) => void;
  parentPhone: string; setParentPhone: (v: string) => void;
  parentAddress: string; setParentAddress: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Parent / Guardian</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Khalid Al-Rashidi" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="khalid@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+965 9123 4567" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={parentAddress} onChange={(e) => setParentAddress(e.target.value)} placeholder="Block 5, Street 12, Salmiya" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepPlayers({
  players, updatePlayer, addPlayer, removePlayer,
}: {
  players: PlayerEntry[];
  updatePlayer: (idx: number, patch: Partial<PlayerEntry>) => void;
  addPlayer: () => void;
  removePlayer: (idx: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Players ({players.length})
        </h2>
        <Button variant="outline" size="sm" onClick={addPlayer} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Player
        </Button>
      </div>

      {players.map((p, idx) => {
        const ageGroup = getAutoAgeGroup(p.dateOfBirth);
        return (
          <Card key={p.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Player {idx + 1}</p>
                {players.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removePlayer(idx)}>
                    <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={p.firstName} onChange={(e) => updatePlayer(idx, { firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={p.lastName} onChange={(e) => updatePlayer(idx, { lastName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={p.dateOfBirth} onChange={(e) => updatePlayer(idx, { dateOfBirth: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Auto Age Group</Label>
                  <div className="flex h-10 items-center rounded-lg border px-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--card)" }}>
                    {ageGroup || "Enter DOB"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={p.gender}
                    onChange={(e) => updatePlayer(idx, { gender: e.target.value as "MALE" | "FEMALE" })}
                    className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Player Type</Label>
                  <select
                    value={p.playerType}
                    onChange={(e) => updatePlayer(idx, { playerType: e.target.value as "OUTFIELD" | "GOALKEEPER" })}
                    className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="OUTFIELD">Outfield</option>
                    <option value="GOALKEEPER">Goalkeeper</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input value={p.position} onChange={(e) => updatePlayer(idx, { position: e.target.value })} placeholder="Midfielder" />
                </div>
                <div className="space-y-2">
                  <Label>Subscription Type</Label>
                  <select
                    value={p.subType}
                    onChange={(e) => updatePlayer(idx, { subType: e.target.value as SubType })}
                    className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="NEW_MEMBERSHIP">New Membership (72 KWD)</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="SINGLE_SESSION">Single Session (10 KWD)</option>
                    <option value="TRIAL_SESSION">Trial Session (Free)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StepClothing({
  players, updatePlayer,
}: {
  players: PlayerEntry[];
  updatePlayer: (idx: number, patch: Partial<PlayerEntry>) => void;
}) {
  const membershipCount = players.filter(
    (p) => p.subType === "NEW_MEMBERSHIP" || p.subType === "RENEWAL"
  ).length;
  const freeClothing = membershipCount >= 2;

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Clothing & Kit</h2>
          {freeClothing && (
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Free clothing set included for {membershipCount} membership players!
            </p>
          )}
        </div>

        {players.map((p, idx) => (
          <div key={p.id} className="rounded-lg border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {p.firstName || `Player ${idx + 1}`} {p.lastName}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Clothing Size</Label>
                <select
                  value={p.clothingSize}
                  onChange={(e) => updatePlayer(idx, { clothingSize: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {["XS", "S", "M", "L", "XL"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Shirt Name</Label>
                <Input
                  value={p.preferredShirtName}
                  onChange={(e) => updatePlayer(idx, { preferredShirtName: e.target.value.toUpperCase() })}
                  placeholder={p.firstName.toUpperCase() || "NAME"}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Shirt Number</Label>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={p.preferredShirtNumber}
                  onChange={(e) => updatePlayer(idx, { preferredShirtNumber: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StepPricing({
  pricing, players, couponCode, setCouponCode, couponResult, validateCoupon, validatingCoupon,
}: {
  pricing: ReturnType<typeof calculateBatchPricing>;
  players: PlayerEntry[];
  couponCode: string;
  setCouponCode: (v: string) => void;
  couponResult: { valid: boolean; discountPerPlayer: number; couponId?: string; error?: string } | null;
  validateCoupon: () => void;
  validatingCoupon: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Pricing Summary</h2>

        {/* Per-player breakdown */}
        <div className="space-y-3">
          {players.map((p, idx) => {
            const pr: PricingResult = pricing.items[idx];
            return (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {p.firstName || `Player ${idx + 1}`} {p.lastName}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {p.subType.replace(/_/g, " ")} · {tierLabel(pr.tier)}
                    {pr.freeClothing && " · Free Kit"}
                  </p>
                </div>
                <div className="text-right">
                  {pr.discount > 0 && (
                    <p className="text-xs line-through" style={{ color: "var(--muted-foreground)" }}>
                      {formatKWD(pr.basePrice)}
                    </p>
                  )}
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    {formatKWD(pr.finalPrice)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coupon */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" /> Coupon Code
          </Label>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="HATTRICK10"
              className="uppercase"
            />
            <Button variant="outline" onClick={validateCoupon} disabled={validatingCoupon || !couponCode}>
              {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
          {couponResult && (
            <p className="text-xs" style={{ color: couponResult.valid ? "var(--foreground)" : "#f87171" }}>
              {couponResult.valid
                ? `Coupon applied! ${formatKWD(couponResult.discountPerPlayer)} off per player`
                : couponResult.error}
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span>Subtotal</span>
            <span>{formatKWD(pricing.subtotal)}</span>
          </div>
          {pricing.totalDiscount > 0 && (
            <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
              <span>Family Discount</span>
              <span>-{formatKWD(pricing.totalDiscount)}</span>
            </div>
          )}
          {pricing.totalCouponDiscount > 0 && (
            <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
              <span>Coupon Discount</span>
              <span>-{formatKWD(pricing.totalCouponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-lg font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            <span>Total</span>
            <span>{formatKWD(pricing.grandTotal)}</span>
          </div>
          {pricing.freeClothing && (
            <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
              Includes free clothing set for all membership players
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StepReview({
  parentName, parentEmail, parentPhone, players, pricing, couponResult,
}: {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  players: PlayerEntry[];
  pricing: ReturnType<typeof calculateBatchPricing>;
  couponResult: { valid: boolean; discountPerPlayer: number; couponId?: string } | null;
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Review & Confirm</h2>

        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Parent</p>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>{parentName}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{parentEmail} · {parentPhone}</p>
        </div>

        <div className="space-y-3">
          {players.map((p, idx) => {
            const ageGroup = getAutoAgeGroup(p.dateOfBirth);
            const pr = pricing.items[idx];
            return (
              <div key={p.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {ageGroup} · {p.playerType} · {p.subType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Kit: {p.clothingSize} · {p.preferredShirtName || p.firstName.toUpperCase()} #{p.preferredShirtNumber || "—"}
                    </p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatKWD(pr.finalPrice)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between border-t pt-3 text-lg font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
          <span>Grand Total</span>
          <span>{formatKWD(pricing.grandTotal)}</span>
        </div>

        {couponResult?.valid && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Coupon discount applied: {formatKWD(pricing.totalCouponDiscount)} off
          </p>
        )}
      </CardContent>
    </Card>
  );
}
