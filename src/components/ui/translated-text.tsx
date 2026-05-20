"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n";

/**
 * Renders a translated string inside a span. Use in server-component JSX
 * where you can't call useTranslation() directly.
 */
export function T({
  k,
  vars,
  className,
  style,
}: {
  k: TranslationKey;
  vars?: Record<string, string | number>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useTranslation();
  return (
    <span className={className} style={style}>
      {t(k, vars)}
    </span>
  );
}
