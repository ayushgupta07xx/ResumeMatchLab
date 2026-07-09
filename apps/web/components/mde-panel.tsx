"use client";
import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";
import type { Effect } from "@/lib/types";

/** Minimum detectable effect (Cohen's d) over the alpha x power grid, plus the
 * required-N / achieved-power framing. All values come from the report's effect
 * block — nothing computed here. */
export function MdePanel({ effect, nJobs }: { effect: Effect; nJobs: number }) {
  const { t } = useTheme();
  const rows = effect.mde ?? [];
  if (!rows.length) return null;

  // Alpha columns are every key except "power", in ascending alpha order.
  const alphaKeys = Object.keys(rows[0])
    .filter((k) => k !== "power")
    .sort((a, b) => parseFloat(a.split("=")[1]) - parseFloat(b.split("=")[1]));

  const cell: React.CSSProperties = {
    padding: "8px 12px",
    fontFamily: FF.mono,
    fontSize: 12.5,
    textAlign: "right",
    borderTop: `1px solid var(--accent-soft)`,
  };
  const head: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 11,
    color: t.muted,
    textAlign: "right",
    fontWeight: 500,
  };

  const isOperating = (power: number, ak: string) =>
    Math.abs(power - 0.8) < 1e-9 && ak === "alpha=0.05";

  return (
    <div
      style={{
        border: `1px solid var(--accent)`,
        borderRadius: 14,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Minimum detectable effect
        </div>
        <div style={{ fontSize: 11.5, color: t.muted, marginTop: 3 }}>
          Smallest true effect (Cohen&rsquo;s d) this test could catch, across
          significance (&alpha;) and power. At the conventional &alpha;=0.05,
          80% power the floor is{" "}
          <span style={{ fontFamily: FF.mono, color: t.text }}>
            {(rows.find((r) => Math.abs(r.power - 0.8) < 1e-9)?.["alpha=0.05"] ??
              0
            ).toFixed(4)}
          </span>{" "}
          &mdash; well below the observed |d|={Math.abs(effect.cohens_d ?? 0).toFixed(2)}.
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: "left" }}>power &darr; / &alpha; &rarr;</th>
              {alphaKeys.map((ak) => (
                <th key={ak} style={head}>
                  {ak.replace("alpha=", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.power}>
                <td
                  style={{
                    ...cell,
                    textAlign: "left",
                    color: t.muted,
                    fontFamily: FF.mono,
                  }}
                >
                  {(r.power * 100).toFixed(0)}%
                </td>
                {alphaKeys.map((ak) => (
                  <td
                    key={ak}
                    style={{
                      ...cell,
                      background: isOperating(r.power, ak)
                        ? "var(--accent-soft)"
                        : "transparent",
                      fontWeight: isOperating(r.power, ak) ? 600 : 400,
                    }}
                  >
                    {(r[ak] ?? 0).toFixed(4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "8px 16px 0", fontSize: 10.5, color: t.muted }}>
        <span style={{ background: "var(--accent-soft)", padding: "1px 6px", borderRadius: 4 }}>
          highlighted
        </span>{" "}
        = conventional operating point (&alpha;=0.05, 80% power).
      </div>
      <div style={{ padding: "10px 16px", fontSize: 11, color: t.muted, borderTop: `1px solid var(--accent-soft)` }}>
        Achieved power {((effect.achieved_power ?? 0) * 100).toFixed(0)}% at N={nJobs.toLocaleString()} paired jobs · required N for 80% power ={" "}
        {Math.round(effect.required_n_80 ?? 0)}.
      </div>
    </div>
  );
}
