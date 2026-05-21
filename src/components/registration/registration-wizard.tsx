"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight, ChevronLeft, Check, Loader2,
  User, Shield, Shirt, CreditCard, Tag, Plus, Trash2, Phone,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { calculateBatchPricing, formatKWD, PLAN_PRICES, getAutoAgeGroup, KIT_ITEMS, TRAINING_DAYS } from "@/lib/pricing";
import type { PricingResult, SubscriptionPlan } from "@/lib/pricing";

/* ── Types ───────────────────────────────────────────────────────────────────── */

type SubType = "NEW_MEMBERSHIP" | "RENEWAL" | "SINGLE_SESSION" | "TRIAL_SESSION" | "FREE_TRIAL";

interface PlayerEntry {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  playerType: "OUTFIELD" | "GOALKEEPER";
  position: string;
  subType: SubType;
  plan: SubscriptionPlan;
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
    plan: "TRAINING_ONLY",
    clothingSize: "M",
    preferredShirtName: "",
    preferredShirtNumber: "",
  };
}

/* ── Wizard ──────────────────────────────────────────────────────────────────── */

export function RegistrationWizard() {
  const { t } = useTranslation();
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
    players.map((p) => ({ type: p.subType, plan: p.plan })),
    couponResult?.valid ? couponResult.discountPerPlayer : 0
  );

  const updatePlayer = useCallback((idx: number, patch: Partial<PlayerEntry>) => {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }, []);

  const addPlayer = () => setPlayers((prev) => [...prev, emptyPlayer()]);
  const removePlayer = (idx: number) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((_, i) => i !== idx));
    setCouponResult(null);
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
      const parentRes = await fetch("/api/players", { method: "GET" });
      if (!parentRes.ok) {
        const errData = await parentRes.json().catch(() => ({}));
        setError(errData.error || (parentRes.status === 401 ? "Please log in and try again." : "Server error. Please try again."));
        return;
      }

      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const ageGroup = getAutoAgeGroup(p.dateOfBirth);
        const pr = pricing.items[i];

        const playerRes = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: p.firstName, lastName: p.lastName,
            dateOfBirth: p.dateOfBirth, gender: p.gender,
            ageGroup, playerType: p.playerType,
            position: p.position || null,
            clothingSize: p.clothingSize,
            preferredShirtName: p.preferredShirtName || p.firstName.toUpperCase(),
            preferredShirtNumber: p.preferredShirtNumber ? parseInt(p.preferredShirtNumber) : null,
            parentId: "LOOKUP",
            parentEmail, parentName, parentPhone, parentAddress,
            freeTrialUsed: p.subType === "FREE_TRIAL",
          }),
        });

        if (!playerRes.ok) { const err = await playerRes.json(); setError(err.error || `Failed to create player ${p.firstName}`); return; }
        const playerData = await playerRes.json();

        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 10);

        const subRes = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: playerData.id, parentId: playerData.parentId,
            type: p.subType, plan: p.plan,
            startDate: now.toISOString(), endDate: endDate.toISOString(),
            totalSessions: p.subType === "SINGLE_SESSION" ? 1 : p.subType === "FREE_TRIAL" || p.subType === "TRIAL_SESSION" ? 1 : 40,
            amount: pr.finalPrice,
            discount: pr.discount + pr.couponDiscount,
            couponId: couponResult?.couponId || null,
          }),
        });

        if (!subRes.ok) { const err = await subRes.json(); setError(err.error || `Failed to create subscription`); return; }
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
      case 2: return true;
      case 3: return true;
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
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{t("registration_complete")}</h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {t("players_registered_msg", { n: players.length })} {formatKWD(pricing.grandTotal)}
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => { setSuccess(false); setStep(0); setPlayers([emptyPlayer()]); setCouponResult(null); }}>
              {t("register_another")}
            </Button>
            <Button onClick={() => window.location.href = "/dashboard/subscriptions"}>
              {t("view_subscriptions")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Training days info */}
      <div className="rounded-lg px-4 py-2 text-center text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}>
        {t("training_days")}: {TRAINING_DAYS.join(", ")}
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.key} className="flex items-center">
              <button onClick={() => i < step && setStep(i)} disabled={i > step}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: active ? "var(--primary)" : done ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "var(--primary-foreground)" : done ? "var(--foreground)" : "var(--muted-foreground)",
                  cursor: i <= step ? "pointer" : "default",
                }}>
                {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className="mx-1 h-px w-6" style={{ background: i < step ? "var(--foreground)" : "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>{error}</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {step === 0 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{t("parent_guardian")}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("full_name")} *</Label>
                    <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Khalid Al-Rashidi" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("email")} *</Label>
                    <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="khalid@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> {t("phone")} *</Label>
                    <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+965 9123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("address")}</Label>
                    <Input value={parentAddress} onChange={(e) => setParentAddress(e.target.value)} placeholder="Block 5, Street 12, Salmiya" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  {t("players")} ({players.length})
                </h2>
                <Button variant="outline" size="sm" onClick={addPlayer} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> {t("add_player_btn")}
                </Button>
              </div>

              {players.map((p, idx) => {
                const ageGroup = getAutoAgeGroup(p.dateOfBirth);
                return (
                  <Card key={p.id}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t("player")} {idx + 1}</p>
                        {players.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removePlayer(idx)}>
                            <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("first_name")} *</Label>
                          <Input value={p.firstName} onChange={(e) => updatePlayer(idx, { firstName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("last_name")} *</Label>
                          <Input value={p.lastName} onChange={(e) => updatePlayer(idx, { lastName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("date_of_birth")} *</Label>
                          <Input type="date" value={p.dateOfBirth} onChange={(e) => updatePlayer(idx, { dateOfBirth: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("auto_age_group")}</Label>
                          <div className="flex h-10 items-center rounded-lg border px-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--card)" }}>
                            {ageGroup || t("enter_dob")}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("gender")}</Label>
                          <select value={p.gender} onChange={(e) => updatePlayer(idx, { gender: e.target.value as "MALE" | "FEMALE" })}
                            className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="MALE">{t("male")}</option>
                            <option value="FEMALE">{t("female")}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("player_type")}</Label>
                          <select value={p.playerType} onChange={(e) => updatePlayer(idx, { playerType: e.target.value as "OUTFIELD" | "GOALKEEPER" })}
                            className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="OUTFIELD">{t("outfield")}</option>
                            <option value="GOALKEEPER">{t("goalkeeper")}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("select_plan")}</Label>
                          <select value={p.plan} onChange={(e) => updatePlayer(idx, { plan: e.target.value as SubscriptionPlan })}
                            className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="TRAINING_ONLY">{t("plan_training_only")} (60 KWD)</option>
                            <option value="TRAINING_WITH_KIT">{t("plan_training_with_kit")} (72 KWD)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("subscription_type")}</Label>
                          <select value={p.subType} onChange={(e) => updatePlayer(idx, { subType: e.target.value as SubType })}
                            className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="NEW_MEMBERSHIP">{t("new_membership")}</option>
                            <option value="RENEWAL">{t("renewal")}</option>
                            <option value="SINGLE_SESSION">{t("single_session")} (10 KWD)</option>
                            <option value="FREE_TRIAL">{t("free_trial")} ({t("free")})</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{t("clothing_kit")}</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {t("kit_includes")}
                  </p>
                </div>
                {players.map((p, idx) => (
                  <div key={p.id} className="rounded-lg border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {p.firstName || `Player ${idx + 1}`} {p.lastName}
                      </p>
                      {p.plan === "TRAINING_WITH_KIT" && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(255,255,255,0.1)", color: "var(--foreground)" }}>
                          {t("plan_training_with_kit")}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>{t("clothing_size")}</Label>
                        <select value={p.clothingSize} onChange={(e) => updatePlayer(idx, { clothingSize: e.target.value })}
                          className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                          {["XS", "S", "M", "L", "XL"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("shirt_name")}</Label>
                        <Input value={p.preferredShirtName}
                          onChange={(e) => updatePlayer(idx, { preferredShirtName: e.target.value.toUpperCase() })}
                          placeholder={p.firstName.toUpperCase() || "NAME"} className="uppercase" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("shirt_number")}</Label>
                        <Input type="number" min="1" max="99" value={p.preferredShirtNumber}
                          onChange={(e) => updatePlayer(idx, { preferredShirtNumber: e.target.value })} placeholder="10" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{t("pricing_summary")}</h2>
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
                            {p.subType.replace(/_/g, " ")} · {pr.plan ? (pr.plan === "TRAINING_ONLY" ? t("plan_training_only") : t("plan_training_with_kit")) : "—"}
                            {pr.includesKit && ` · ${KIT_ITEMS.join(", ")}`}
                          </p>
                        </div>
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatKWD(pr.finalPrice)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {t("coupon_code")}</Label>
                  <div className="flex gap-2">
                    <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="HATTRICK10" className="uppercase" />
                    <Button variant="outline" onClick={validateCoupon} disabled={validatingCoupon || !couponCode}>
                      {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : t("apply")}
                    </Button>
                  </div>
                  {couponResult && (
                    <p className="text-xs" style={{ color: couponResult.valid ? "var(--foreground)" : "#f87171" }}>
                      {couponResult.valid ? `${t("coupon_applied")} ${formatKWD(couponResult.discountPerPlayer)} ${t("off_per_player")}` : couponResult.error}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
                    <span>{t("subtotal")}</span><span>{formatKWD(pricing.subtotal)}</span>
                  </div>
                  {pricing.totalCouponDiscount > 0 && (
                    <div className="flex justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
                      <span>{t("coupon_discount")}</span><span>-{formatKWD(pricing.totalCouponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-lg font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                    <span>{t("grand_total")}</span><span>{formatKWD(pricing.grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardContent className="p-6 space-y-5">
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{t("review_confirm")}</h2>
                <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{t("parent")}</p>
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
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{p.firstName} {p.lastName}</p>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {ageGroup} · {p.playerType} · {p.subType.replace(/_/g, " ")} · {pr.plan ? (pr.plan === "TRAINING_ONLY" ? "60 KWD" : "72 KWD") : "—"}
                            </p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatKWD(pr.finalPrice)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <span>{t("grand_total")}</span><span>{formatKWD(pricing.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("back")}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => { setError(null); setStep(step + 1); }} disabled={!canAdvance()}>
            {t("next")} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("registration_complete")}
          </Button>
        )}
      </div>
    </div>
  );
}
