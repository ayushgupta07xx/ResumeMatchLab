# Python ↔ R Numerical Validation

ResumeMatch Lab's statistical engine is implemented in **Python** (`stats/`) and
re-implemented in **R** (`analysis/r/compare.qmd`). Both run on the *same* paired-delta
vector, exported once by `scripts/export_demo_deltas.py` to `analysis/r/demo_deltas.csv`
(N = 9,014 jobs; DevOps Resume A vs Data-Scientist Resume B). Agreeing on identical inputs
is what makes the result implementation-independent.

## Tolerances (per project rule)

| Quantity | Tolerance |
|---|---|
| Deterministic point estimates (mean, t/Wilcoxon stat, Cohen's d, CUPED R², Bayes posterior, mSPRT p) | 1e-6 |
| Bootstrap interval bounds (Monte-Carlo) | ~1% |

## Validated results — Python vs R

Python from `scripts/export_demo_deltas.py`; R from `analysis/r/validate.R` (and the
rendered `compare.qmd`), both on the identical `demo_deltas.csv` (N = 9,014).

| Statistic | Python | R | Agreement |
|---|---|---|---|
| N | 9014 | 9014 | exact |
| Mean Δ (B − A) | −0.0220993925 | −0.0220993924 | < 1e-9 ✓ |
| Cohen's d | −0.4410031169 | −0.4410031166 | < 1e-9 ✓ |
| Wilcoxon p-value | 0 (underflow) | 0 (underflow) | both → 0 ✓ |
| Bootstrap BCa 95% CI | [−0.0231541, −0.0210872] | [−0.0231476, −0.0210524] | < 0.2% (Monte-Carlo) ✓ |
| CUPED variance reduction (R²) | 0.5002721874 | 0.5002721872 | < 1e-8 ✓ |
| Bayes wins k (of 9014) | 2508 | 2508 | exact ✓ |
| Bayes P(B>A per job) | 0 (underflow) | 0 (pbeta underflow) | both ≈ 0 ✓ |
| mSPRT always-valid p | 8.4976e-303 | 0 (underflow) | both ≈ 0 ✓ |
| Achieved power | 1.000 | 1.000 | exact ✓ |

Every deterministic estimate agrees to ≤ 1e-8; the stochastic bootstrap agrees to within
~0.2% (well inside the 1% Monte-Carlo tolerance). The only nominal "differences" are in the
deep tails — both languages' Wilcoxon and mSPRT p-values underflow toward 0 (SciPy retains
8.5e-303 for the mSPRT p; R prints exactly 0) — all effectively zero. **The statistics are
implementation-independent.**

## Why these should match

- **Mean, Cohen's d, Bayes, mSPRT** are deterministic closed-form computations on the same
  numbers → expected to agree to ~machine precision (1e-6 easily).
- **CUPED** is the R² of the same OLS design (cluster fixed effects + standardized
  description length); Python (`numpy.linalg.lstsq`) and R (`lm`) solve the identical normal
  equations → agreement to 1e-6.
- **Wilcoxon / t-test** use the same definitions; SciPy and base R differ only in tie/
  continuity handling, controlled here (`correct = FALSE`). At N = 9,014 the normal-approx
  p-value underflows to 0 in both.
- **Bootstrap** is stochastic; with `set.seed(42)` and 10,000 resamples the BCa bounds agree
  to ~0.2% (different RNG streams across languages preclude exact equality — expected, and
  the gap shrinks relative to the 2k snapshot because the interval itself is tighter).

## Status

**Validated (2026-06-10).** The R pipeline was executed under R 4.5.3 with
`readr`/`dplyr`/`boot`/`pwr`; `analysis/r/compare.html` is the rendered notebook and the
table above is the real Python-vs-R comparison on the 9,014-job corpus. Reproduce with:

```bash
quarto render analysis/r/compare.qmd            # -> analysis/r/compare.html
Rscript analysis/r/validate.R                   # prints the R column above
```

Any future deviation beyond the stated tolerances should be recorded here.
