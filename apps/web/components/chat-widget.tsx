"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import { useTheme, useResults } from "@/lib/providers";
import { ACC, FF } from "@/lib/theme";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! I can explain what ResumeMatch does, what its numbers mean, and how to read its charts — whether or not you've run a comparison yet. Ask me anything about the product.",
};

const SUGGESTIONS = [
  "What does ResumeMatch actually do?",
  "Explain the metrics — Cohen's d, mSPRT, CUPED, BH-FDR.",
  "How do I read the distribution and posterior charts?",
];

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Minimal inline markdown: **bold**, `code`, and paragraph breaks. No dependency.
function inline(s: string, t: { text: string }, keyBase: string) {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[2] !== undefined) {
      parts.push(<strong key={`${keyBase}b${k++}`} style={{ fontWeight: 700, color: t.text }}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      parts.push(<code key={`${keyBase}c${k++}`} style={{ fontFamily: FF.mono, fontSize: "0.85em", background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 4px" }}>{m[3]}</code>);
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

function isTableBlock(block: string): boolean {
  const lines = block.split("\n").filter((l) => l.trim());
  return (
    lines.length >= 2 &&
    lines[0].includes("|") &&
    /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[1]) &&
    lines[1].includes("-")
  );
}

function splitRow(line: string): string[] {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}

function renderRich(text: string, t: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, bi) => {
    if (isTableBlock(block)) {
      const lines = block.split("\n").filter((l) => l.trim());
      const head = splitRow(lines[0]);
      const body = lines.slice(2).map(splitRow);
      return (
        <div key={bi} style={{ overflowX: "auto", margin: bi === 0 ? 0 : "8px 0 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%" }}>
            <thead>
              <tr>
                {head.map((h, hi) => (
                  <th key={hi} style={{ textAlign: "left", padding: "4px 8px", borderBottom: `1px solid ${t.text}33`, fontWeight: 700, color: t.text, whiteSpace: "nowrap" }}>
                    {inline(h, t, `h${bi}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, ci) => (
                    <td key={ci} style={{ padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", verticalAlign: "top" }}>
                      {inline(cell, t, `r${bi}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return renderBlock(block, bi, t);
  });
}

function renderBlock(block: string, bi: number, t: { text: string }) {
  {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(block)) !== null) {
      if (m.index > last) parts.push(block.slice(last, m.index));
      if (m[2] !== undefined) {
        parts.push(
          <strong key={`b${bi}-${k++}`} style={{ fontWeight: 700, color: t.text }}>
            {m[2]}
          </strong>,
        );
      } else if (m[3] !== undefined) {
        parts.push(
          <code
            key={`c${bi}-${k++}`}
            style={{
              fontFamily: FF.mono,
              fontSize: "0.85em",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "1px 4px",
            }}
          >
            {m[3]}
          </code>,
        );
      }
      last = m.index + m[0].length;
    }
    if (last < block.length) parts.push(block.slice(last));
    return (
      <p key={bi} style={{ margin: bi === 0 ? 0 : "8px 0 0", whiteSpace: "pre-wrap" }}>
        {parts}
      </p>
    );
  }
}

export function ChatWidget() {
  const { t } = useTheme();
  const { result } = useResults();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [size, setSize] = useState({ w: 372, h: 520 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHint(true);
    const id = setTimeout(() => setHint(false), 5000); // 5s dwell
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      // reset conversation whenever the panel is closed
      if (!next) {
        setMessages([GREETING]);
        setInput("");
        setError("");
      }
      return next;
    });
  }

  const startResize = (e: ReactPointerEvent) => {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const sw = size.w;
    const sh = size.h;
    const onMove = (ev: PointerEvent) => {
      const w = Math.min(Math.max(sw + (sx - ev.clientX), 320), window.innerWidth - 40);
      const h = Math.min(Math.max(sh + (ev.clientY - sy), 360), window.innerHeight - 112);
      setSize({ w, h });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setError("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m.role === "user" || m.role === "assistant"),
          result: result ?? null,
          page: pathname,
        }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? "The assistant is unavailable right now.");
      }
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* placeholder color can't be set inline — inject once */}
      <style>{`.rm-chat-input::placeholder{color:${t.muted};opacity:1;}`}</style>

      {hint && !open && (
        <div
          style={{
            position: "fixed", bottom: 30, right: 84, zIndex: 50,
            background: t.text,
            color: t.bg, fontFamily: FF.body, fontSize: 13, fontWeight: 700,
            padding: "9px 14px", borderRadius: 999,
            boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
          }}
        >
          {pathname === "/results"
            ? "Ask any detail about the result here \u2192"
            : "Questions? Ask the assistant"}
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={open ? "Close assistant" : "Open assistant"}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 50, height: 52, width: 52,
          borderRadius: 999, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: t.bg, background: t.text,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35)",
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6a8.5 8.5 0 0 1-.9-3.9 8.38 8.38 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", bottom: 84, right: 20, zIndex: 50,
            width: size.w, height: size.h,
            maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 112px)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            borderRadius: 16, background: t.bg, border: `1px solid var(--accent)`,
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.9)",
          }}
        >
          {/* resize grip (bottom-left) */}
          <div
            onPointerDown={startResize}
            title="Drag to resize"
            aria-label="Resize chat"
            style={{
              position: "absolute", bottom: 4, left: 4, zIndex: 20,
              height: 16, width: 16, cursor: "nesw-resize", opacity: 0.5,
              background:
                "linear-gradient(45deg, transparent 55%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.5) 65%, transparent 65%, transparent 78%, rgba(255,255,255,0.5) 78%, rgba(255,255,255,0.5) 88%, transparent 88%)",
            }}
          />

          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderBottom: `1px solid ${t.border}`,
            }}
          >
            <span style={{ fontFamily: FF.display, fontSize: 14, fontWeight: 700, color: t.text }}>
              ResumeMatch assistant
            </span>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "88%", fontFamily: FF.body, fontSize: 13.5, lineHeight: 1.55,
                    color: t.text,
                    background: m.role === "user" ? `${ACC}22` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${t.border}`, borderRadius: 14, padding: "8px 12px",
                  }}
                >
                  {m.role === "user" ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                  ) : (
                    renderRich(m.content, t)
                  )}
                </div>
              </div>
            ))}

            {loading && <div style={{ fontFamily: FF.body, fontSize: 13, color: t.muted }}>…thinking</div>}
            {error && <div style={{ fontFamily: FF.body, fontSize: 12.5, color: "#ef4444" }}>{error}</div>}

            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = t.text;
                      e.currentTarget.style.color = t.bg;
                      e.currentTarget.style.borderColor = t.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = t.muted;
                      e.currentTarget.style.borderColor = t.border;
                    }}
                    style={{
                      width: "100%", textAlign: "left", fontFamily: FF.body, fontSize: 12.5,
                      color: t.muted, background: "transparent",
                      border: `1px solid ${t.border}`,
                      borderRadius: 10, padding: "9px 12px", cursor: "pointer",
                      transition: "all 140ms ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <textarea
                className="rm-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={pathname === "/results" ? "Ask about the result…" : "Ask about ResumeMatch…"}
                style={{
                  flex: 1, resize: "none", maxHeight: 96, fontFamily: FF.body, fontSize: 13.5,
                  color: t.text, background: "rgba(0,0,0,0.3)", border: `1px solid ${t.border}`,
                  borderRadius: 10, padding: "8px 12px", outline: "none",
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send"
                style={{
                  borderRadius: 10, border: "none",
                  cursor: loading || !input.trim() ? "default" : "pointer",
                  opacity: loading || !input.trim() ? 0.4 : 1,
                  color: t.bg, background: ACC, fontFamily: FF.body, fontSize: 14, fontWeight: 700,
                  padding: "8px 12px",
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
