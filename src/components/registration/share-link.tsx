"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { Copy, Check, Share2, MessageCircle } from "lucide-react";

export function ShareRegistrationLink() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const regUrl = typeof window !== "undefined"
    ? `${window.location.origin}/register`
    : "/register";

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${t("whatsapp_share_text")} ${regUrl}`)}`;

  function copyLink() {
    navigator.clipboard.writeText(regUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t("share_registration")}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {regUrl}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("link_copied") : t("copy_link")}
            </Button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5" style={{ background: "#25D366", color: "#fff" }}>
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
