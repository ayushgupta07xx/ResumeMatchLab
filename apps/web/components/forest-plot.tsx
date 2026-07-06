"use client";

import {
  Bar,
  BarChart,
  Cell,
  ErrorBar,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { useState } from "react";
import { A, B, FF } from "@/lib/theme";

function Card({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { t } = useTheme();
  return (
    <div style={{ background: "transparent", border: `1px solid var(--accent)`, borderRadius: 16, padding: 20 }}>
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
  const rows = [...clusters]
    .filter((c) => c.mean_delta !== null)
    .sort((a, b) => (a.mean_delta ?? 0) - (b.mean_delta ?? 0))
    .map((c) => {
      const x = (c.mean_delta ?? 0) * 100;
      const lo = (c.ci_low ?? 0) * 100;
      const hi = (c.ci_high ?? 0) * 100;
      const color = c.winner === "A" ? A : c.winner === "B" ? B : t.faint;
      return { label: c.label, x, err: [x - lo, hi - x] as [number, number], color, row: c };
    });

  return (
    <Card
      title="Where each résumé matches better — by job cluster"
      subtitle="Average score gap per cluster (percentage points), with 95% bootstrap intervals."
    >
      {selected ? (
        <DiffPanel row={selected} onBack={() => setSelected(null)} t={t} />
      ) : (
      <>
      <div style={{ height: 360, width: "100%", marginTop: 14 }}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 28, bottom: 8, left: 8 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: t.muted, fontFamily: FF.mono }}
              tickFormatter={(v: any) => v.toFixed(0)}
              stroke={t.border}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={156}
              tick={{ fontSize: 12, fill: t.text }}
              stroke={t.border}
            />
            <ReferenceLine x={0} stroke={t.faint} strokeDasharray="3 3" />
            <Tooltip
              cursor={{ fill: t.surface2, opacity: 0.5 }}
              contentStyle={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 12,
                color: t.text,
                fontFamily: FF.mono,
              }}
              labelStyle={{ color: t.text }}
              itemStyle={{ color: t.text }}
              formatter={(v: any) => [`${v.toFixed(2)} pts`, "Δ (B − A)"]}
            />
            <Bar
              dataKey="x"
              radius={2}
              isAnimationActive={false}
              cursor="pointer"
              onClick={(d: any) => setSelected(d?.payload?.row ?? null)}
              onMouseEnter={(_: any, i: number) => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <LabelList
                dataKey="x"
                content={(props: any) => {
                  const { x, y, width, height, index, viewBox } = props;
                  if (index !== hovered) return null;
                  const label = "(click to see details)";
                  const px = 6.2 * label.length; // approx text width at 10.5px mono
                  const barEnd = x + width; // right end for +bars, left end for -bars
                  const rightEdge = (viewBox?.x ?? 0) + (viewBox?.width ?? 9999);
                  const leftEdge = viewBox?.x ?? 0;
                  let tx: number;
                  let anchor: "start" | "end";
                  let inside = false;
                  if (width >= 0) {
                    if (barEnd + 8 + px <= rightEdge) { tx = barEnd + 8; anchor = "start"; }
                    else { tx = barEnd - 8; anchor = "end"; inside = true; }
                  } else {
                    if (barEnd - 8 - px >= leftEdge) { tx = barEnd - 8; anchor = "end"; }
                    else { tx = barEnd + 8; anchor = "start"; inside = true; }
                  }
                  const wide = Math.abs(width) > px + 20;
                  return (
                    <text x={tx} y={y + height / 2} dy={3} textAnchor={anchor}
                      style={{ fontFamily: FF.mono, fontSize: 10.5, fill: inside ? t.text : t.muted, letterSpacing: "0.02em" }}>
                      {label}
                    </text>
                  );
                }}
              />
              {rows.map((r, i) => (
                <Cell key={i} fill={r.color} fillOpacity={hovered === null || hovered === i ? 1 : 0.45} />
              ))}
              <ErrorBar dataKey="err" direction="x" width={4} strokeWidth={1.2} stroke={t.faint} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div
        className="flex items-center justify-between"
        style={{ fontFamily: FF.mono, fontSize: 10, color: t.faint, marginTop: 6, letterSpacing: "0.04em" }}
      >
        <span>{"\u25C0"} Résumé A matches better</span>
        <span>Résumé B matches better {"\u25B6"}</span>
      </div>
      </>
      )}
    </Card>
  );
}

function Chips({ items, color, t }: { items: { skill: string; freq: number }[]; color: string; t: any }) {
  if (!items.length)
    return (
      <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: t.faint, letterSpacing: "0.04em" }}>
        no distinguishing skills in this segment
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

function DiffPanel({ row, onBack, t }: { row: ClusterRow; onBack: () => void; t: any }) {
  const d = row.differentiators ?? { a_favoring: [], b_favoring: [] };
  return (
    <div style={{ marginTop: 14, animation: "fadeIn 220ms ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"}</style>
      <button
        onClick={onBack}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = t.bg; e.currentTarget.style.borderColor = "var(--accent)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.text; e.currentTarget.style.borderColor = "var(--accent)"; }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
          fontFamily: FF.mono, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.08em", color: t.text, background: "transparent",
          border: `1px solid var(--accent)`, borderRadius: 999, padding: "7px 15px",
          cursor: "pointer", transition: "all 160ms ease",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{"\u2190"}</span> back to all clusters
      </button>
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
