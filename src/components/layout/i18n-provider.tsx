"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { I18nContext, translate, getDir, type Locale, type TranslationKey } from "@/lib/i18n";

const LOCALE_KEY = "hattrick-locale";

/**
 * Read stored locale synchronously to avoid hydration mismatch.
 * On SSR this returns "en" (no localStorage). On client first render
 * it reads localStorage so the initial render matches.
 */
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // SSR or localStorage blocked
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
    document.documentElement.dir = getDir(l);
    document.documentElement.lang = l;
  }, []);

  // Sync dir/lang on mount and locale change
  useEffect(() => {
    document.documentElement.dir = getDir(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, dir: getDir(locale), t, setLocale }),
    [locale, t, setLocale]
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
