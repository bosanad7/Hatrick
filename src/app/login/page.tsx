"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { LanguageToggle } from "@/components/layout/language-toggle";

export default function LoginPage() {
  const router = useRouter();
  const { t, dir } = useTranslation();
  const isRTL = dir === "rtl";
  const [email, setEmail]       = useState("admin@hattrick.com.kw");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError(t("invalid_credentials"));
    else router.push("/dashboard");
  }

  const featureItems = [
    t("login_feature_players"),
    t("login_feature_schedules"),
    t("login_feature_payments"),
    t("login_feature_ai"),
    t("login_feature_pitches"),
  ];

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div
      className="relative flex min-h-screen overflow-hidden"
      style={{ background: "#000000" }}
      dir={dir}
    >
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-60" />

      {/* Subtle glow effects */}
      <div
        className="pointer-events-none absolute -bottom-40 h-96 w-96 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)",
          ...(isRTL ? { right: "-10rem" } : { left: "-10rem" }),
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 h-64 w-64 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)",
          ...(isRTL ? { left: "-8rem" } : { right: "-8rem" }),
        }}
      />

      {/* Language toggle — floating top corner */}
      <div className="absolute top-4 z-10" style={isRTL ? { left: "1rem" } : { right: "1rem" }}>
        <LanguageToggle />
      </div>

      {/* ── LEFT — brand panel (desktop) ─────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-16">
        {/* Logo */}
        <Image
          src="/hattrick-logo.webp"
          alt="Hattrick"
          width={160}
          height={21}
          className="logo-invert"
          priority
        />

        {/* Headline */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.4,0,0.2,1] }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {t("login_tagline")}
            </p>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white">
              {t("login_headline_1")}
              <br />
              <span style={{ color: "rgba(255,255,255,0.25)" }}>{t("login_headline_2")}</span>
              <br />
              {t("login_headline_3")}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-wrap gap-6"
          >
            {featureItems.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full" style={{ background: "#ffffff" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom wordmark watermark */}
        <p
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.12)" }}
        >
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>

      {/* ── RIGHT — login form ────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center p-6 lg:border-l"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <Image
              src="/hattrick-logo.webp"
              alt="Hattrick"
              width={140}
              height={18}
              className="logo-invert"
              priority
            />
          </div>

          {/* Card */}
          <div
            className="rounded-xl border p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Top line */}
            <div className="mb-6 h-px w-12 rounded-full" style={{ background: "#ffffff" }} />

            <h2 className="mb-1 text-xl font-bold text-white">{t("login_title")}</h2>
            <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("login_subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {t("email_label")}
                </label>
                <input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email_placeholder")}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:opacity-30"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                  onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  dir="ltr"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {t("password")}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("password_placeholder")}
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:opacity-30"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      paddingRight: isRTL ? "2.5rem" : undefined,
                      paddingLeft: isRTL ? undefined : undefined,
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                    onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      ...(isRTL ? { left: "0.75rem" } : { right: "0.75rem" }),
                    }}
                  >
                    {showPass
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye    className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#ffffff", color: "#000000" }}
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><span>{t("login")}</span><Arrow className="h-4 w-4" /></>
                }
              </motion.button>
            </form>
          </div>

          <p
            className="mt-4 text-center text-[11px]"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
