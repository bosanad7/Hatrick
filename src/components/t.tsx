"use client";

import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

/**
 * Inline translated text for use inside server components.
 * Usage: <T k="my_sessions" /> or <T k="remaining_postponements" vars={{ n: 3 }} />
 */
export function T({
  k,
  vars,
}: {
  k: TranslationKey;
  vars?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  return <>{t(k, vars)}</>;
}
