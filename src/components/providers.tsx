"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/components/layout/i18n-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      themes={["dark","light"]}
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        <I18nProvider>{children}</I18nProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
