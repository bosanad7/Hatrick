"use client";

import { createContext, useContext } from "react";
import { en, type TranslationKey } from "./en";
import { ar } from "./ar";

export type Locale = "en" | "ar";

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, ar };

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  dir: "ltr",
  t: (key) => en[key] ?? key,
  setLocale: () => {},
});

export function useTranslation() {
  return useContext(I18nContext);
}

/**
 * Get translation string with optional variable interpolation.
 * Variables use {key} syntax, e.g. t("minutes_ago", { n: 5 }) → "5m ago"
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let str = dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export type { TranslationKey };
