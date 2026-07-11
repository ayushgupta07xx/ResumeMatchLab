"use client";
import type { FitClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { useEffect, useState } from "react";
import { FF } from "@/lib/theme";

// Sequential strength ramp — leans-toward (high pct) → green, away-from (low) → faint.
const STRONG = "#2ea043";
const MID = "#bb8009";

function Card({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const { t } = useTheme();
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: t.cardShadow,
      }}
    >
      <h3
        style={{
          fontFamily: FF.display,
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "6px 0 0" }}>{subtitle}</p>
      {children}
    </div>
  );
}

export function FitBars({
  clusters,
  onSelect,
}: {
  clusters: FitClusterRow[];
  onSelect?: (row: FitClusterRow) => void;
}) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = [...clusters]
    .sort((a, b) => b.percentile - a.percentile)
    .map((c) => ({
      label: c.label,
      pct: c.percentile,
      color: c.percentile >= 66 ? STRONG : c.percentile >= 33 ? MID : t.faint,
      row: c,
    }));

  // Geometry — mirrors the forest plot's gutter/value columns.
  const GUTTER = 248; // fits longest cluster name
  const VALCOL = 44;
  const ROW_H = 32;
  const BAR_H = 14;
  const W = 720;
  const plotL = GUTTER;
  const plotR = W - VALCOL;
  const plotW = plotR - plotL;
  const AXIS_H = 22;
  const H = rows.length * ROW_H + 8 + AXIS_H;

  const px = (v: number) => plotL + (v / 100) * plotW; // 0..100 -> x

  return (
    <Card
      title="Where this résumé leans — by job cluster"
      subtitle="Relative match strength per cluster, as a percentile against the corpus score spread (0–100). Click a bar to open that role."
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) { .fb-bar { transition: none !important; } }
      `}</style>
      <div style={{ width: "100%", marginTop: 16, overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Per-cluster fit percentile chart">
          {/* gridlines at 0 / 50 / 100 */}
          {[0, 50, 100].map((g) => (
            <line
              key={g}
              x1={px(g)} y1={2} x2={px(g)} y2={rows.length * ROW_H + 4}
              stroke={t.text} strokeOpacity={g === 0 ? 0.28 : 0.1} strokeWidth={1}
            />
          ))}

          {rows.map((r, i) => {
            const cy = i * ROW_H + ROW_H / 2 + 2;
            const isHover = hovered === i;
            const dim = hovered !== null && !isHover;
            const barW = Math.max(px(r.pct) - plotL, 1);
            return (
              <g
                key={i}
                style={{ cursor: onSelect ? "pointer" : "default" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(r.row)}
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
                {/* bar — grows from left on mount */}
                <rect
                  className="fb-bar"
                  x={plotL} y={cy - BAR_H / 2}
                  width={barW} height={BAR_H} rx={2}
                  fill={r.color} fillOpacity={dim ? 0.4 : isHover ? 1 : 0.85}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "left center",
                    transform: mounted ? "scaleX(1)" : "scaleX(0)",
                    transition: `transform 520ms cubic-bezier(0.22,1,0.36,1) ${i * 32}ms`,
                  }}
                />
                {/* value */}
                <text
                  x={W - 8} y={cy} dy={4} textAnchor="end"
                  style={{ fontFamily: FF.mono, fontSize: 12, fill: r.color, fillOpacity: dim ? 0.5 : 1 }}
                >
                  {Math.round(r.pct)}
                </text>
                {/* hover chevron */}
                {isHover && onSelect && (
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

          {/* axis ticks */}
          {[0, 50, 100].map((g) => (
            <text
              key={g}
              x={px(g)} y={rows.length * ROW_H + AXIS_H} textAnchor={g === 0 ? "start" : g === 100 ? "end" : "middle"}
              style={{ fontFamily: FF.mono, fontSize: 10.5, fill: t.faint }}
            >
              {g}
            </text>
          ))}
        </svg>
      </div>
    </Card>
  );
}
