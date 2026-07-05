"use client";

import { useTheme } from "@/lib/providers";
import { ACC, A, B, FF } from "@/lib/theme";

// Canonical reference run (DevOps resume A vs data-scientist resume B),
// validated against a simulated cohort. The mini-forest shows only the two
// clusters where the losing resume (B) still wins — real, canonical deltas.
const B_WIN_LANES = [
  { label: "Machine Learning / AI", delta: 3.54 },
  { label: "DevOps / SRE / Cloud", delta: 3.60 },
];
const DOM = 5;

export function ExampleVerdict() {
  const { t } = useTheme();
  return (
    <div
      style={{
        position: "relative",
        background: "transparent",
        border: "1px solid var(--accent)",
        borderRadius: 18,
        padding: "30px 32px 26px",
        boxShadow: "none",
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 16 }}>
        <span style={{ fontFamily: FF.mono, fontSize: 10.5, letterSpacing: "0.16em", color: t.faint }}>
          VERDICT
        </span>
        <span
          className="inline-flex items-center"
          style={{
            fontFamily: FF.mono,
            gap: 6,
            fontSize: 10.5,
            fontWeight: 500,
            color: t.accentText,
            border: `1px solid ${ACC}66`,
            borderRadius: 999,
            padding: "4px 11px",
          }}
        >
          high confidence
        </span>
      </div>

      <div style={{ fontFamily: FF.display, fontSize: 21, fontWeight: 600, marginTop: 18, color: t.muted }}>
        Resume <span style={{ color: A, fontWeight: 700 }}>A</span> wins by
      </div>
      <div className="flex items-end" style={{ gap: 12, marginTop: 2 }}>
        <span style={{ fontFamily: FF.display, fontSize: 64, fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
          2.01
        </span>
        <span style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 500, color: t.muted, paddingBottom: 9 }}>
          points
        </span>
      </div>
      <div style={{ fontFamily: FF.mono, fontSize: 12, color: t.faint, marginTop: 14, letterSpacing: "0.01em" }}>
        95% CI [1.91, 2.12]&nbsp;&nbsp;&nbsp;p &lt; 0.001&nbsp;&nbsp;&nbsp;d = &minus;0.41
      </div>

      <div style={{ height: 1, background: t.border, margin: "24px 0 14px" }} />

      <div style={{ fontFamily: FF.body, fontSize: 12.5, color: t.muted, marginBottom: 4 }}>
        A wins overall — here&apos;s where Resume B still edges ahead:
      </div>

      {B_WIN_LANES.map((l) => (
        <div key={l.label} className="flex items-center" style={{ gap: 16, padding: "11px 0" }}>
          <span style={{ width: 142, fontSize: 12.5, color: t.text, textAlign: "right", letterSpacing: "-0.01em" }}>
            {l.label}
          </span>
          <div style={{ position: "relative", flex: 1, height: 16 }}>
            <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 1, background: t.border }} />
            <div
              style={{
                position: "absolute",
                top: "50%",
                height: 2,
                borderRadius: 2,
                background: B,
                opacity: 0.85,
                left: "50%",
                width: `${(l.delta / DOM) * 50}%`,
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                width: 8,
                height: 8,
                borderRadius: 999,
                background: B,
                boxShadow: `0 0 0 3px ${t.surface}`,
                left: `calc(${(l.delta / DOM) * 50 + 50}% - 4px)`,
                transform: "translateY(-50%)",
              }}
            />
          </div>
          <span style={{ fontFamily: FF.mono, width: 46, fontSize: 12, color: B, textAlign: "right" }}>
            +{l.delta.toFixed(2)}
          </span>
        </div>
      ))}

      <div
        className="flex items-center justify-between"
        style={{ fontFamily: FF.mono, fontSize: 9.5, color: t.faint, marginTop: 10, letterSpacing: "0.04em" }}
      >
        <span>{"\u25C0"} A WINS</span>
        <span>8 clusters</span>
        <span>B WINS {"\u25B6"}</span>
      </div>
    </div>
  );
}
