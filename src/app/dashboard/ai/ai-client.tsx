"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, User, Bot, Loader2,
  Users, CalendarDays, BarChart3, Megaphone, CreditCard,
  FileText, TicketCheck, Trophy,
} from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

const QUICK_PROMPTS: { icon: typeof CreditCard; labelKey: TranslationKey; prompt: string }[] = [
  { icon: CreditCard,   labelKey: "ai_payment_insights",   prompt: "Show me payment insights — overdue and pending" },
  { icon: CalendarDays, labelKey: "ai_upcoming_schedule",   prompt: "Show me the upcoming training schedule for this week" },
  { icon: Users,        labelKey: "ai_attendance_summary",  prompt: "Summarize attendance rates by age group this month" },
  { icon: BarChart3,    labelKey: "ai_monthly_report",      prompt: "Generate a comprehensive monthly report" },
  { icon: FileText,     labelKey: "ai_subscription_status", prompt: "Show subscription overview and expiring soon" },
  { icon: TicketCheck,  labelKey: "ai_support_tickets",     prompt: "Show support ticket overview and resolution rate" },
  { icon: Trophy,       labelKey: "ai_player_analytics",    prompt: "Show player enrollment analytics by age group" },
  { icon: Megaphone,    labelKey: "ai_draft_announcement",  prompt: "Draft a professional weekly announcement for parents" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function MessageBubble({ msg, isRTL, locale }: { msg: Message; isRTL: boolean; locale: string }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{
          background: isUser
            ? "var(--primary)"
            : "rgba(255,255,255,0.1)",
        }}
      >
        {isUser
          ? <User className="h-3.5 w-3.5 text-white" />
          : <Bot  className="h-3.5 w-3.5" style={{ color: "var(--foreground)" }} />
        }
      </div>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${isUser ? (isRTL ? "rounded-tl-sm" : "rounded-tr-sm") : (isRTL ? "rounded-tr-sm" : "rounded-tl-sm")}`}
        style={{
          background: isUser ? "var(--primary)" : "var(--card)",
          border: isUser ? "none" : "1px solid var(--border)",
          color: isUser ? "var(--primary-foreground)" : "var(--foreground)",
        }}
      >
        {msg.content.split("\n").map((line, i) => {
          if (line.startsWith("## ")) return <p key={i} className="mb-2 text-base font-bold">{line.slice(3)}</p>;
          if (line.startsWith("### ")) return <p key={i} className="mb-1.5 mt-3 text-sm font-bold">{line.slice(4)}</p>;
          if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
          if (line.startsWith("- ") || line.startsWith("• ")) {
            const text = line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1");
            return <p key={i} className={isRTL ? "mr-2" : "ml-2"}>{"•"} {text}</p>;
          }
          if (line.startsWith("|")) return <p key={i} className="font-mono text-[11px]" style={{ color: isUser ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)" }}>{line}</p>;
          if (line === "---") return <hr key={i} className="my-2 opacity-20" />;
          if (line.trim() === "") return <div key={i} className="h-1" />;
          return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")}</p>;
        })}
        <p className="mt-1.5 text-[10px] opacity-40">
          {msg.timestamp.toLocaleTimeString(locale === "ar" ? "ar-KW" : "en-KW", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

export function AIAssistantClient() {
  const { t, locale, dir } = useTranslation();
  const isRTL = dir === "rtl";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    setLoading(true);
    fetch("/api/ai/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "overview" }),
    })
      .then((r) => r.json())
      .then((data) => {
        setMessages([{
          role: "assistant",
          content: data.content ?? "Welcome! I'm your Hattrick Academy AI Assistant. Ask me anything.",
          timestamp: new Date(),
        }]);
      })
      .catch(() => {
        setMessages([{
          role: "assistant",
          content: "Welcome! I'm your Hattrick Academy AI Assistant. Ask me anything about your academy.",
          timestamp: new Date(),
        }]);
      })
      .finally(() => setLoading(false));
  }, [initialized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(content: string) {
    if (!content.trim() || loading) return;
    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content ?? "I encountered an issue processing that request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }
    setLoading(false);
  }

  const featureList = t("ai_features").split(",");

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isRTL={isRTL} locale={locale} />
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <Bot className="h-3.5 w-3.5" style={{ color: "var(--foreground)" }} />
              </div>
              <div
                className="flex items-center gap-1.5 rounded-xl rounded-tl-sm px-4 py-3"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--foreground)" }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="border-t px-6 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map(({ icon: Icon, labelKey, prompt }) => (
              <motion.button
                key={labelKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => send(prompt)}
                disabled={loading}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--muted)" }}
              >
                <Icon className="h-3 w-3" /> {t(labelKey)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai_placeholder")}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "var(--muted)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              dir={isRTL ? "rtl" : "ltr"}
              onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.3)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-40"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" style={isRTL ? { transform: "scaleX(-1)" } : {}} />}
            </motion.button>
          </form>
        </div>
      </div>

      {/* Sidebar info panel */}
      <div
        className="hidden w-64 shrink-0 xl:block"
        style={{
          background: "var(--surface)",
          ...(isRTL
            ? { borderRight: "1px solid var(--border)" }
            : { borderLeft: "1px solid var(--border)" }
          ),
        }}
      >
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--primary)" }}
            >
              <Sparkles className="h-4 w-4" style={{ color: "var(--primary-foreground)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t("ai_title")}</p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{t("ai_live_mode")}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {t("ai_description")}
          </p>
          <div className="mt-4 space-y-2">
            {featureList.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--foreground)" }} />
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
