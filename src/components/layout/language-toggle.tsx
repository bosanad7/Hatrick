"use client";

import { useTranslation } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors"
      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
      title={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{locale === "en" ? "AR" : "EN"}</span>
    </motion.button>
  );
}
