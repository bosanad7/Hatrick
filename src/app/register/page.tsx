"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  User, Shield, CreditCard, Check, ChevronRight, ChevronLeft,
  Loader2, Upload, Phone, FileText,
} from "lucide-react";
import { CivilIdReader } from "@/components/registration/civil-id-reader";
import { formatKWD, PLAN_PRICES, getAutoAgeGroup, TRAINING_DAYS, KIT_ITEMS } from "@/lib/pricing";

type Plan = "TRAINING_ONLY" | "TRAINING_WITH_KIT";

const STEPS = [
  { key: "parent", label: "Parent Info", labelAr: "بيانات ولي الأمر", icon: User },
  { key: "player", label: "Player Info", labelAr: "بيانات اللاعب", icon: Shield },
  { key: "plan", label: "Plan & Payment", labelAr: "الخطة والدفع", icon: CreditCard },
  { key: "review", label: "Review", labelAr: "مراجعة", icon: Check },
] as const;

export default function PublicRegistrationPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isAr = lang === "ar";

  // Parent fields
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAddress, setParentAddress] = useState("");

  // Player fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("MALE");
  const [playerType, setPlayerType] = useState("OUTFIELD");

  // Civil ID
  const [civilIdNumber, setCivilIdNumber] = useState("");
  const [civilIdName, setCivilIdName] = useState("");
  const [civilIdNationality, setCivilIdNationality] = useState("");

  // Plan
  const [plan, setPlan] = useState<Plan>("TRAINING_ONLY");
  const [freeTrial, setFreeTrial] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const ageGroup = getAutoAgeGroup(dob);
  const amount = freeTrial ? 0 : PLAN_PRICES[plan];

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!parentName && !!parentEmail && !!parentPhone;
      case 1: return !!firstName && !!lastName && !!dob;
      case 2: return true;
      default: return true;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName, parentEmail, parentPhone, parentAddress,
          playerFirstName: firstName, playerLastName: lastName,
          playerDob: dob, playerGender: gender, playerType,
          plan, freeTrial,
          couponCode: couponCode || undefined,
          civilIdNumber: civilIdNumber || undefined,
          civilIdName: civilIdName || undefined,
          civilIdNationality: civilIdNationality || undefined,
          civilIdConfirmed: !!civilIdNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
        setSuccess(true);
      } else if (data.freeTrial) {
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#000" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-xl border p-8 text-center space-y-6"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {freeTrial
              ? (isAr ? "تم تسجيل التجربة المجانية!" : "Free Trial Registered!")
              : (isAr ? "تم إرسال التسجيل!" : "Registration Submitted!")}
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {freeTrial
              ? (isAr ? "سيتواصل معكم فريق الأكاديمية قريباً" : "The academy team will contact you shortly")
              : paymentUrl
                ? (isAr ? "يرجى إتمام الدفع لاستكمال التسجيل" : "Please complete payment to finalize registration")
                : (isAr ? "سيتم التواصل معكم لترتيب الدفع" : "We will contact you to arrange payment")}
          </p>
          {paymentUrl && (
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-black"
              style={{ background: "#fff" }}
            >
              <CreditCard className="h-4 w-4" />
              {isAr ? "ادفع الآن" : "Pay Now"} — {formatKWD(amount)}
            </a>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#000" }} dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <Image src="/hattrick-logo.webp" alt="Hattrick" width={120} height={16} className="logo-invert" priority />
        </div>
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="rounded-md px-3 py-1.5 text-xs font-medium" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
      </div>

      <div className="mx-auto max-w-xl px-6 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{isAr ? "تسجيل لاعب" : "Player Registration"}</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {isAr ? "سجّل طفلك في أكاديمية هاتريك هيروز" : "Register your child at Hattrick Heroes Academy"}
          </p>
          <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {isAr ? `أيام التدريب: السبت، الإثنين، الأربعاء` : `Training days: ${TRAINING_DAYS.join(", ")}`}
          </p>
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
                    background: active ? "#fff" : done ? "rgba(255,255,255,0.1)" : "transparent",
                    color: active ? "#000" : done ? "#fff" : "rgba(255,255,255,0.3)",
                    cursor: i <= step ? "pointer" : "default",
                  }}
                >
                  {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{isAr ? s.labelAr : s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="mx-1 h-px w-6" style={{ background: i < step ? "#fff" : "rgba(255,255,255,0.1)" }} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {/* Step 0: Parent */}
            {step === 0 && (
              <div className="rounded-xl border p-6 space-y-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-lg font-bold text-white">{isAr ? "بيانات ولي الأمر" : "Parent / Guardian"}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label={isAr ? "الاسم الكامل *" : "Full Name *"} value={parentName} onChange={setParentName} placeholder="Khalid Al-Rashidi" />
                  <InputField label={isAr ? "البريد الإلكتروني *" : "Email *"} type="email" value={parentEmail} onChange={setParentEmail} placeholder="khalid@email.com" dir="ltr" />
                  <InputField label={isAr ? "رقم الهاتف *" : "Mobile Number *"} value={parentPhone} onChange={setParentPhone} placeholder="+965 9123 4567" dir="ltr"
                    icon={<Phone className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />} />
                  <InputField label={isAr ? "العنوان" : "Address"} value={parentAddress} onChange={setParentAddress} placeholder="Block 5, Street 12, Salmiya" />
                </div>
              </div>
            )}

            {/* Step 1: Player */}
            {step === 1 && (
              <div className="rounded-xl border p-6 space-y-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-lg font-bold text-white">{isAr ? "بيانات اللاعب" : "Player Information"}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label={isAr ? "الاسم الأول *" : "First Name *"} value={firstName} onChange={setFirstName} />
                  <InputField label={isAr ? "اسم العائلة *" : "Last Name *"} value={lastName} onChange={setLastName} />
                  <InputField label={isAr ? "تاريخ الميلاد *" : "Date of Birth *"} type="date" value={dob} onChange={setDob} dir="ltr" />
                  <div className="space-y-2">
                    <label className="block text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {isAr ? "الفئة العمرية" : "Age Group (Auto)"}
                    </label>
                    <div className="flex h-10 items-center rounded-lg border px-3 text-sm text-white" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                      {ageGroup || (isAr ? "أدخل تاريخ الميلاد" : "Enter DOB")}
                    </div>
                  </div>
                  <SelectField label={isAr ? "الجنس" : "Gender"} value={gender} onChange={setGender}
                    options={[{ value: "MALE", label: isAr ? "ذكر" : "Male" }, { value: "FEMALE", label: isAr ? "أنثى" : "Female" }]} />
                  <SelectField label={isAr ? "نوع اللاعب" : "Player Type"} value={playerType} onChange={setPlayerType}
                    options={[{ value: "OUTFIELD", label: isAr ? "لاعب ميداني" : "Outfield" }, { value: "GOALKEEPER", label: isAr ? "حارس مرمى" : "Goalkeeper" }]} />
                </div>

                {/* Civil ID Section — OCR Upload + Manual */}
                <div className="border-t pt-4 mt-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {/* OCR Reader */}
                  <CivilIdReader
                    lang={lang}
                    onDataExtracted={(data) => {
                      if (data.civilIdNumber) setCivilIdNumber(data.civilIdNumber);
                      if (data.civilIdName) setCivilIdName(data.civilIdName);
                      if (data.civilIdNationality) setCivilIdNationality(data.civilIdNationality);
                      if (data.civilIdDob && !dob) setDob(data.civilIdDob);
                    }}
                  />

                  {/* Manual fields (pre-filled by OCR or editable) */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {isAr ? "أو أدخل البيانات يدوياً" : "Or enter manually / edit extracted data"}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField label={isAr ? "رقم البطاقة المدنية" : "Civil ID Number"} value={civilIdNumber} onChange={setCivilIdNumber} placeholder="2XXXXXXXXXXX" dir="ltr" />
                      <InputField label={isAr ? "الاسم في البطاقة" : "Name on Civil ID"} value={civilIdName} onChange={setCivilIdName} />
                      <InputField label={isAr ? "الجنسية" : "Nationality"} value={civilIdNationality} onChange={setCivilIdNationality} placeholder={isAr ? "كويتي" : "Kuwaiti"} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Plan & Payment */}
            {step === 2 && (
              <div className="rounded-xl border p-6 space-y-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-lg font-bold text-white">{isAr ? "اختر الخطة" : "Select Plan"}</h2>

                {/* Free trial toggle */}
                <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer" style={{ borderColor: freeTrial ? "#fff" : "rgba(255,255,255,0.08)", background: freeTrial ? "rgba(255,255,255,0.05)" : "transparent" }}>
                  <input type="checkbox" checked={freeTrial} onChange={(e) => setFreeTrial(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-white">{isAr ? "تجربة مجانية" : "Free Trial"}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {isAr ? "حصة تجريبية مجانية لمرة واحدة" : "One-time free trial session — 0 KWD"}
                    </p>
                  </div>
                </label>

                {!freeTrial && (
                  <>
                    {/* Plan cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(["TRAINING_ONLY", "TRAINING_WITH_KIT"] as Plan[]).map((p) => (
                        <button key={p} onClick={() => setPlan(p)}
                          className="rounded-lg border p-5 text-left transition-all"
                          style={{
                            borderColor: plan === p ? "#fff" : "rgba(255,255,255,0.08)",
                            background: plan === p ? "rgba(255,255,255,0.05)" : "transparent",
                          }}
                        >
                          <p className="text-lg font-bold text-white">{formatKWD(PLAN_PRICES[p])}</p>
                          <p className="mt-1 text-sm font-medium text-white">
                            {p === "TRAINING_ONLY"
                              ? (isAr ? "تدريب فقط" : "Training Only")
                              : (isAr ? "تدريب + طقم" : "Training + Kit")}
                          </p>
                          <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {p === "TRAINING_ONLY"
                              ? (isAr ? "حصص تدريبية فقط" : "Training sessions only")
                              : (isAr ? "تدريب + شورت وجوارب وتيشيرت" : `Training + ${KIT_ITEMS.join(", ")}`)}
                          </p>
                          {plan === p && (
                            <div className="mt-3 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                              <Check className="h-3 w-3 text-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Coupon */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {isAr ? "رمز القسيمة" : "Coupon Code"}
                      </label>
                      <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="HATTRICK10" dir="ltr"
                        className="w-full rounded-lg px-3.5 py-2.5 text-sm text-white outline-none uppercase"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="rounded-xl border p-6 space-y-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-lg font-bold text-white">{isAr ? "مراجعة وتأكيد" : "Review & Confirm"}</h2>

                <div className="space-y-3">
                  <ReviewItem label={isAr ? "ولي الأمر" : "Parent"} value={`${parentName} · ${parentEmail} · ${parentPhone}`} />
                  <ReviewItem label={isAr ? "اللاعب" : "Player"} value={`${firstName} ${lastName} · ${ageGroup} · ${gender === "MALE" ? (isAr ? "ذكر" : "Male") : (isAr ? "أنثى" : "Female")}`} />
                  {civilIdNumber && <ReviewItem label={isAr ? "البطاقة المدنية" : "Civil ID"} value={civilIdNumber} />}
                  <ReviewItem label={isAr ? "الخطة" : "Plan"}
                    value={freeTrial
                      ? (isAr ? "تجربة مجانية — ٠ د.ك" : "Free Trial — 0 KWD")
                      : `${plan === "TRAINING_ONLY" ? (isAr ? "تدريب فقط" : "Training Only") : (isAr ? "تدريب + طقم" : "Training + Kit")} — ${formatKWD(amount)}`} />
                  <ReviewItem label={isAr ? "أيام التدريب" : "Training Days"} value={isAr ? "السبت، الإثنين، الأربعاء" : "Saturday, Monday, Wednesday"} />
                </div>

                <div className="flex justify-between border-t pt-3 text-lg font-bold text-white" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <span>{isAr ? "الإجمالي" : "Total"}</span>
                  <span>{formatKWD(amount)}</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setStep(step - 1)} disabled={step === 0}
            className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-white disabled:opacity-30"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}>
            <ChevronLeft className="h-4 w-4" /> {isAr ? "رجوع" : "Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => { setError(null); setStep(step + 1); }} disabled={!canAdvance()}
              className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-30"
              style={{ background: "#fff", color: "#000" }}>
              {isAr ? "التالي" : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ background: "#fff", color: "#000" }}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {freeTrial
                ? (isAr ? "تسجيل التجربة" : "Register Trial")
                : (isAr ? "تسجيل وادفع" : "Register & Pay")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────────── */

function InputField({ label, value, onChange, type = "text", placeholder, dir, icon }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; dir?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir}
          className={`w-full rounded-lg px-3.5 py-2.5 text-sm text-white outline-none placeholder:opacity-30 ${icon ? "pl-9" : ""}`}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3.5 py-2.5 text-sm text-white outline-none"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <p className="text-xs uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
