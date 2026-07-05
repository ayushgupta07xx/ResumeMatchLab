import type { CompareResponse } from "@/lib/types";
import { fmtP, fmtPct, fmtPts, relativeEdge, winRates } from "@/lib/format";

// Client-only: jsPDF is dynamically imported so it never runs at build/SSR.
export async function downloadReport(
  result: CompareResponse,
  names: { a: string; b: string } | null,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const L = 48;
  let y = 56;
  const write = (text: string, size = 10, bold = false, dy = 16) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(20);
    doc.text(text, L, y);
    y += dy;
  };

  const { verdict, summary } = result;
  const { aWins, bWins } = winRates(summary);
  const isTie = verdict.winner === "tie";
  const winner = verdict.winner;
  const winRate = winner === "A" ? aWins : winner === "B" ? bWins : 50;
  const edge = isTie ? null : relativeEdge(summary, winner);
  const [lo, hi] = verdict.ci_points;

  write("ResumeMatch Lab — comparison report", 16, true, 26);
  if (names) write(`Resume A: ${names.a}     vs     Resume B: ${names.b}`, 10, false, 24);

  if (isTie) {
    write("Verdict: no decisive winner", 13, true, 20);
  } else {
    write(`Verdict: Resume ${winner} is the stronger match`, 13, true, 20);
    write(
      `${fmtPct(winRate)} of ${summary.n_jobs.toLocaleString()} jobs it out-scores the other` +
        `${edge === null ? "" : `; ${fmtPct(edge)} higher average match score`}.`,
      10,
      false,
      18,
    );
  }
  const ci = lo !== null && hi !== null ? `[${fmtPts(lo)}, ${fmtPts(hi)}]` : "[—]";
  write(
    `Δ ${fmtPts(verdict.mean_delta_points ?? 0, 2, true)} pts    95% CI ${ci}    ` +
      `p ${fmtP(verdict.p_value)}    d ${fmtPts(verdict.cohens_d ?? 0)}    (${verdict.confidence} confidence)`,
    9,
    false,
    26,
  );

  const { tests, effect, cuped, sequential } = result;
  write("Statistical summary", 12, true, 18);
  const stats: [string, string][] = [
    [tests.primary.name, `p ${fmtP(tests.primary.pvalue)}`],
    [
      "CUPED variance reduction",
      `${fmtPct((cuped.variance_reduction ?? 0) * 100, 1)} · ×${(cuped.effective_n_multiplier ?? 1).toFixed(2)} eff. N`,
    ],
    ["mSPRT (always-valid)", `p ${fmtP(sequential.always_valid_p)}`],
    [
      "Power / required N",
      `${fmtPct((effect.achieved_power ?? 0) * 100, 0)} · N≥${Math.round(effect.required_n_80 ?? 0)}`,
    ],
    ["Cohen's d", fmtPts(effect.cohens_d ?? 0)],
  ];
  stats.forEach(([k, v]) => write(`${k}:   ${v}`, 9, false, 15));
  y += 10;

  write("Per-cluster breakdown  (Δ = B − A, percentage points)", 12, true, 18);
  const cols = [L, 205, 245, 300, 400, 470, 500];
  const head = ["Cluster", "n", "Δ pts", "95% CI", "p (BH)", "Win", "Sig"];
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  head.forEach((h, i) => doc.text(h, cols[i], y));
  y += 4;
  doc.setDrawColor(180);
  doc.line(L, y, 540, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  const rows = [...result.clusters].sort((a, b) => (b.mean_delta ?? 0) - (a.mean_delta ?? 0));
  rows.forEach((c) => {
    const cells = [
      c.label,
      c.n.toLocaleString(),
      fmtPts((c.mean_delta ?? 0) * 100, 2, true),
      `[${fmtPts((c.ci_low ?? 0) * 100)}, ${fmtPts((c.ci_high ?? 0) * 100)}]`,
      fmtP(c.p_bh_fdr),
      c.winner === "tie" ? "—" : c.winner,
      c.sig_bh ? "yes" : "—",
    ];
    cells.forEach((cell, i) => doc.text(String(cell), cols[i], y));
    y += 15;
  });

  y += 12;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Validated against a simulated cohort · ResumeMatch Lab", L, y);

  doc.save("resumematch-report.pdf");
}
