"use client";
import { Btn } from "@/components/btn";
import type { ClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { useEffect, useState } from "react";
import { A, B, FF, type ThemeTokens } from "@/lib/theme";

function Card({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { t } = useTheme();
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, boxShadow: t.cardShadow }}>
      <h3 style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "6px 0 0" }}>{subtitle}</p>
      {children}
    </div>
  );
}

export function ForestPlot({ clusters }: { clusters: ClusterRow[] }) {
  const { t } = useTheme();
  const [selected, setSelected] = useState<ClusterRow | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = [...clusters]
    .filter((c) => c.mean_delta !== null)
    .sort((a, b) => (a.mean_delta ?? 0) - (b.mean_delta ?? 0))
    .map((c) => {
      const x = (c.mean_delta ?? 0) * 100;
      const lo = (c.ci_low ?? 0) * 100;
      const hi = (c.ci_high ?? 0) * 100;
      const color = c.winner === "A" ? A : c.winner === "B" ? B : t.faint;
      return { label: c.label, x, lo, hi, color, row: c };
    });

  // Symmetric domain so zero stays centered; fit the widest bar or whisker.
  const maxAbs = Math.max(
    0.5,
    ...rows.map((r) => Math.max(Math.abs(r.x), Math.abs(r.lo), Math.abs(r.hi))),
  );
  const dom = maxAbs * 1.08; // small padding so extremes don't touch the edge

  // Geometry (SVG user units == px via viewBox width match).
  const GUTTER = 196; // left label column
  const VALCOL = 52; // right value column
  const ROW_H = 32;
  const BAR_H = 13;
  const W = 720; // viewBox width
  const plotL = GUTTER;
  const plotR = W - VALCOL;
  const plotW = plotR - plotL;
  const cx = plotL + plotW / 2; // zero spine x
  const H = rows.length * ROW_H + 8;

  // value -> x pixel
  const px = (v: number) => cx + (v / dom) * (plotW / 2);

  return (
    <Card
      title="Where each résumé matches better — by job cluster"
      subtitle="Average score gap per cluster (percentage points), with 95% bootstrap intervals. Click a row for the skills that separate them."
    >
      {selected ? (
        <DiffPanel row={selected} onBack={() => setSelected(null)} t={t} />
      ) : (
        <>
          <style>{`
            @media (prefers-reduced-motion: reduce) {
              .fp-bar { transition: none !important; }
            }
          `}</style>
          <div style={{ width: "100%", marginTop: 16, overflow: "hidden" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Per-cluster score gap forest plot">
              {/* zero spine */}
              <line x1={cx} y1={2} x2={cx} y2={H - 2} stroke={t.text} strokeOpacity={0.32} strokeWidth={1} />

              {rows.map((r, i) => {
                const cy = i * ROW_H + ROW_H / 2 + 2;
                const isHover = hovered === i;
                const dim = hovered !== null && !isHover;
                const barX = Math.min(cx, px(r.x));
                const barW = Math.abs(px(r.x) - cx);
                const loX = px(r.lo);
                const hiX = px(r.hi);
                return (
                  <g
                    key={i}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(r.row)}
                  >
                    {/* row hover background */}
                    <rect
                      x={0} y={cy - ROW_H / 2} width={W} height={ROW_H}
                      fill={isHover ? t.text : "transparent"} fillOpacity={isHover ? 0.04 : 0}
                    />
                    {/* label */}
                    <text
                      x={GUTTER - 14} y={cy} dy={4} textAnchor="end"
                      style={{ fontFamily: FF.body, fontSize: 12.5, fill: t.text, fillOpacity: dim ? 0.5 : 1 }}
                    >
                      {r.label}
                    </text>
                    {/* CI whisker (hairline + caps) */}
                    <line x1={loX} y1={cy} x2={hiX} y2={cy} stroke={t.faint} strokeWidth={1} strokeOpacity={dim ? 0.4 : 1} />
                    <line x1={loX} y1={cy - 4} x2={loX} y2={cy + 4} stroke={t.faint} strokeWidth={1} strokeOpacity={dim ? 0.4 : 1} />
                    <line x1={hiX} y1={cy - 4} x2={hiX} y2={cy + 4} stroke={t.faint} strokeWidth={1} strokeOpacity={dim ? 0.4 : 1} />
                    {/* bar — grows from spine on mount */}
                    <rect
                      className="fp-bar"
                      x={barX} y={cy - BAR_H / 2}
                      width={barW} height={BAR_H} rx={2}
                      fill={r.color} fillOpacity={dim ? 0.4 : isHover ? 1 : 0.85}
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: r.x >= 0 ? "left center" : "right center",
                        transform: mounted ? "scaleX(1)" : "scaleX(0)",
                        transition: `transform 520ms cubic-bezier(0.22,1,0.36,1) ${i * 32}ms`,
                      }}
                    />
                    {/* value */}
                    <text
                      x={W - 8} y={cy} dy={4} textAnchor="end"
                      style={{ fontFamily: FF.mono, fontSize: 12, fill: r.color, fillOpacity: dim ? 0.5 : 1 }}
                    >
                      {r.x >= 0 ? "+" : "\u2212"}{Math.abs(r.x).toFixed(2)}
                    </text>
                    {/* hover chevron */}
                    {isHover && (
                      <text
                        x={GUTTER - 4} y={cy} dy={4} textAnchor="middle"
                        style={{ fontFamily: FF.mono, fontSize: 11, fill: t.muted }}
                      >
                        {"\u203A"}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div
            className="flex items-center justify-between"
            style={{ fontFamily: FF.mono, fontSize: 10, color: t.faint, marginTop: 8, letterSpacing: "0.04em" }}
          >
            <span>{"\u25C0"} Résumé A matches better</span>
            <span>Résumé B matches better {"\u25B6"}</span>
          </div>
        </>
      )}
    </Card>
  );
}

export function Chips({
  items,
  color,
  t,
  empty = "no distinguishing skills in this segment",
}: {
  items: { skill: string; freq: number }[];
  color: string;
  t: ThemeTokens;
  empty?: string;
}) {
  if (!items.length)
    return (
      <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: t.faint, letterSpacing: "0.04em" }}>
        {empty}
      </span>
    );
  const max = Math.max(...items.map((i) => i.freq), 0.01);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, idx) => (
        <div
          key={it.skill}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            overflow: "hidden",
            borderRadius: 8,
            border: `1px solid ${color}${idx === 0 ? "" : "44"}`,
            padding: "5px 11px",
            background: "transparent",
          }}
        >
          {/* frequency bar — structure encodes the % */}
          <span
            style={{
              position: "absolute", inset: 0, width: `${(it.freq / max) * 100}%`,
              background: color, opacity: idx === 0 ? 0.16 : 0.09,
            }}
          />
          <span
            style={{
              position: "relative", fontFamily: FF.mono,
              fontSize: idx === 0 ? 13 : 12,
              fontWeight: idx === 0 ? 700 : 400,
              color: t.text, letterSpacing: "0.01em",
            }}
          >
            {it.skill}
          </span>
          <span style={{ position: "relative", fontFamily: FF.mono, fontSize: 11, color: t.muted }}>
            {Math.round(it.freq * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function DiffPanel({ row, onBack, t }: { row: ClusterRow; onBack: () => void; t: ThemeTokens }) {
  const d = row.differentiators ?? { a_favoring: [], b_favoring: [] };
  return (
    <div style={{ marginTop: 14, animation: "fadeIn 220ms ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"}</style>
      <Btn
        variant="ghost"
        onClick={onBack}
        style={{
          gap: 8, marginBottom: 20,
          fontFamily: FF.mono, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.08em", padding: "7px 15px",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{"\u2190"}</span> back to all clusters
      </Btn>
      <p style={{ fontFamily: FF.display, fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 4px" }}>
        {row.label}
      </p>
      <p style={{ fontSize: 12.5, color: t.muted, margin: "0 0 16px" }}>
        Skills common in this cluster&apos;s postings that appear in only one résumé — what separates
        A from B here. (The score itself is semantic similarity, so read these as differentiators, not exact causes.)
      </p>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        className="max-[560px]:!grid-cols-1"
      >
        <div>
          <p style={{ fontFamily: FF.mono, fontSize: 10.5, color: A, margin: "0 0 10px", letterSpacing: "0.08em" }}>
            {"\u25C0"} FAVORS RÉSUMÉ A
          </p>
          <Chips items={d.a_favoring} color={A} t={t} />
        </div>
        <div>
          <p style={{ fontFamily: FF.mono, fontSize: 10.5, color: B, margin: "0 0 10px", letterSpacing: "0.08em" }}>
            FAVORS RÉSUMÉ B {"\u25B6"}
          </p>
          <Chips items={d.b_favoring} color={B} t={t} />
        </div>
      </div>
    </div>
  );
}
