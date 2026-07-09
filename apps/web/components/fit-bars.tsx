"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FitClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
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
        background: "transparent",
        border: `1px solid var(--accent)`,
        borderRadius: 16,
        padding: 20,
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

  const rows = [...clusters]
    .sort((a, b) => a.percentile - b.percentile)
    .map((c) => ({
      label: c.label,
      pct: c.percentile,
      score: c.mean_score,
      n: c.n,
      color: c.percentile >= 66 ? STRONG : c.percentile >= 33 ? MID : t.faint,
      row: c,
    }));

  return (
    <Card
      title="Where this résumé leans — by job cluster"
      subtitle="Relative match strength per cluster, as a percentile against the corpus score spread (0–100). Click a bar to open that role."
    >
      <div style={{ height: 34 * rows.length + 60, width: "100%", marginTop: 14 }}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 52, bottom: 8, left: 8 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: t.muted, fontFamily: FF.mono }}
              tickFormatter={(v: number) => `${v}`}
              stroke={t.border}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={168}
              tick={{ fontSize: 12, fill: t.text }}
              stroke={t.border}
            />
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
              formatter={(_v: any, _n: any, item: { payload?: (typeof rows)[number] }) => {
                const p = item?.payload;
                if (!p) return ["", ""];
                return [`${p.pct.toFixed(1)} pct · role fit ${p.row.role_fit} · click to open`, "Fit"];
              }}
            />
            <Bar
              dataKey="pct"
              radius={2}
              isAnimationActive={false}
              cursor={onSelect ? "pointer" : undefined}
              onClick={(d: any) => onSelect?.(d?.payload?.row)}
            >
              {rows.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v: any) => `${Number(v).toFixed(0)}`}
                style={{ fontFamily: FF.mono, fontSize: 11, fill: t.muted }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
