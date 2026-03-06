"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import { chatMessage, type ChatResult } from "@/lib/api";

/* ================================================================
   Types
   ================================================================ */

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  results?: ChatResult[];
  timestamp: Date;
}

/* ================================================================
   Quick-action chips shown on first open
   ================================================================ */

const QUICK_ACTIONS = [
  "What is an HS code?",
  "Find code for tea",
  "How does CeylonHS work?",
  "Search laptop computer",
];

/* ================================================================
   Component
   ================================================================ */

export default function Chatbot() {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await chatMessage(text.trim());
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          role: "bot",
          text: res.reply,
          results: res.results,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: "bot",
          text: "Sorry, I couldn't connect to the server. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* ── Colours ─────────────────────────────────────────────────── */

  const panelBg = isDark
    ? "rgba(15, 17, 30, 0.97)"
    : "rgba(255, 255, 255, 0.98)";
  const headerBg = isDark
    ? "linear-gradient(135deg, #1a1d2e 0%, #0f1117 100%)"
    : "linear-gradient(135deg, #1a6dff 0%, #0ea5e9 100%)";
  const surfaceBg = isDark ? "#1a1d27" : "#f0f4f8";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#f0f2ff" : "#111827";
  const textSecondary = isDark ? "#8b92b0" : "#6b7280";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
  const userBubbleBg =
    "linear-gradient(135deg, #1a6dff 0%, #0ea5e9 100%)";
  const botBubbleBg = isDark ? "rgba(255,255,255,0.06)" : "#f0f4f8";
  const botBubbleText = isDark ? "#e2e8f0" : "#374151";

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            id="chatbot-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={() => setOpen(true)}
            className="fixed z-[9999] flex items-center justify-center rounded-full shadow-2xl"
            style={{
              bottom: 28,
              right: 28,
              width: 60,
              height: 60,
              background: "linear-gradient(135deg, #1a6dff 0%, #0ea5e9 100%)",
              boxShadow:
                "0 8px 32px rgba(26,109,255,0.35), 0 0 0 0 rgba(26,109,255,0.4)",
              cursor: "pointer",
              border: "none",
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open chat"
          >
            {/* Chat icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Pulse ring */}
            <span
              className="chatbot-pulse"
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                border: "2px solid rgba(26,109,255,0.5)",
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chatbot-panel"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed z-[9999] flex flex-col overflow-hidden"
            style={{
              bottom: 28,
              right: 28,
              width: 380,
              height: 540,
              maxHeight: "calc(100dvh - 56px)",
              background: panelBg,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: 24,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark
                ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset"
                : "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset",
            }}
          >
            {/* ── Header ───────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{
                background: headerBg,
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(255,255,255,0.18)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">
                    CeylonHS Assistant
                  </p>
                  <p className="text-[11px] text-white/60 leading-tight">
                    AI-powered HS code help
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-full transition-colors"
                style={{
                  width: 32,
                  height: 32,
                  background: "rgba(255,255,255,0.12)",
                }}
                aria-label="Close chat"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Messages ─────────────────────────────────────── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{
                background: surfaceBg,
                scrollbarWidth: "thin",
                scrollbarColor: isDark
                  ? "rgba(255,255,255,0.1) transparent"
                  : "rgba(0,0,0,0.1) transparent",
              }}
            >
              {/* Welcome message */}
              {messages.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-center py-6"
                >
                  <div
                    className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
                    style={{
                      width: 56,
                      height: 56,
                      background: isDark
                        ? "linear-gradient(135deg, rgba(26,109,255,0.2), rgba(14,165,233,0.2))"
                        : "linear-gradient(135deg, rgba(26,109,255,0.1), rgba(14,165,233,0.1))",
                    }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1a6dff"
                      strokeWidth="1.5"
                    >
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                  </div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: textPrimary }}
                  >
                    Hi! I&apos;m the CeylonHS Assistant
                  </p>
                  <p
                    className="text-xs mb-5"
                    style={{ color: textSecondary }}
                  >
                    Ask me about HS codes or describe a product
                  </p>

                  {/* Quick actions */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_ACTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
                        style={{
                          background: isDark
                            ? "rgba(26,109,255,0.12)"
                            : "rgba(26,109,255,0.08)",
                          color: "#1a6dff",
                          border: `1px solid ${
                            isDark
                              ? "rgba(26,109,255,0.2)"
                              : "rgba(26,109,255,0.15)"
                          }`,
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message bubbles */}
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i === messages.length - 1 ? 0.05 : 0 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: userBubbleBg,
                            color: "white",
                            borderBottomRightRadius: 6,
                          }
                        : {
                            background: botBubbleBg,
                            color: botBubbleText,
                            borderBottomLeftRadius: 6,
                            border: `1px solid ${borderColor}`,
                          }
                    }
                  >
                    {/* Render markdown-like bold */}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong style="font-weight:700">$1</strong>'
                          )
                          .replace(/\n/g, "<br/>"),
                      }}
                    />

                    {/* HS code result cards */}
                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {msg.results.map((r) => (
                          <div
                            key={r.hscode}
                            className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px]"
                            style={{
                              background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.04)",
                              border: `1px solid ${
                                isDark
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(0,0,0,0.06)"
                              }`,
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <span
                                className="font-bold"
                                style={{ color: "#1a6dff" }}
                              >
                                {r.hscode}
                              </span>
                              <p
                                className="truncate mt-0.5"
                                style={{ color: textSecondary }}
                              >
                                {r.description}
                              </p>
                            </div>
                            <span
                              className="ml-2 shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  r.relevance_pct >= 80
                                    ? "rgba(16,185,129,0.12)"
                                    : "rgba(245,158,11,0.12)",
                                color:
                                  r.relevance_pct >= 80
                                    ? "#10b981"
                                    : "#f59e0b",
                              }}
                            >
                              {r.relevance_pct.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div
                    className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                    style={{
                      background: botBubbleBg,
                      border: `1px solid ${borderColor}`,
                      borderBottomLeftRadius: 6,
                    }}
                  >
                    <span className="chatbot-dot" style={{ animationDelay: "0ms" }} />
                    <span className="chatbot-dot" style={{ animationDelay: "150ms" }} />
                    <span className="chatbot-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Input bar ────────────────────────────────────── */}
            <div
              className="shrink-0 px-4 py-3 flex items-center gap-2"
              style={{
                borderTop: `1px solid ${borderColor}`,
                background: panelBg,
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about an HS code…"
                className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
                style={{
                  background: inputBg,
                  color: textPrimary,
                  border: `1px solid ${borderColor}`,
                  caretColor: "#1a6dff",
                }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center rounded-xl transition-all"
                style={{
                  width: 40,
                  height: 40,
                  background:
                    input.trim() && !loading
                      ? "linear-gradient(135deg, #1a6dff 0%, #0ea5e9 100%)"
                      : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                }}
                aria-label="Send message"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={input.trim() && !loading ? "white" : textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
