# Python ↔ R Numerical Validation

ResumeMatch Lab's statistical engine is implemented in **Python** (`stats/`) and
re-implemented in **R** (`analysis/r/compare.qmd`). Both run on the *same* paired-delta
vector, exported once by `scripts/export_demo_deltas.py` to `analysis/r/demo_deltas.csv`
(N = 2,000 jobs; DevOps Resume A vs Data-Scientist Resume B). Agreeing on identical inputs
is what makes the result implementation-independent.

## Tolerances (per project rule)

| Quantity | Tolerance |
|---|---|
| Deterministic point estimates (mean, t/Wilcoxon stat, Cohen's d, CUPED R², Bayes posterior, mSPRT p) | 1e-6 |
| Bootstrap interval bounds (Monte-Carlo) | ~1% |

## Validated results — Python vs R

Python from `scripts/export_demo_deltas.py`; R from `analysis/r/validate.R` (and the
rendered `compare.qmd`), both on the identical `demo_deltas.csv` (N = 2,000).

| Statistic | Python | R | Agreement |
|---|---|---|---|
| N | 2000 | 2000 | exact |
| Mean Δ (B − A) | −0.020792938 | −0.020792938 | < 1e-8 ✓ |
| Cohen's d | −0.396174565 | −0.396174565 | < 1e-9 ✓ |
| Wilcoxon p-value | 6.8137e-75 | 6.8137e-75 | exact (6 s.f.) ✓ |
| Bootstrap BCa 95% CI | [−0.0230473, −0.0184498] | [−0.0230593, −0.0184647] | < 0.06% (Monte-Carlo) ✓ |
| CUPED variance reduction (R²) | 0.548642618 | 0.548642617 | < 1e-8 ✓ |
| Bayes wins k (of 2000) | 590 | 590 | exact ✓ |
| Bayes P(B>A per job) | 1.50e-77 | 0 (pbeta underflow) | both ≈ 0 ✓ |
| mSPRT always-valid p | 3.3137e-67 | 3.3137e-67 | exact (6 s.f.) ✓ |
| Achieved power | 1.000 | 1.000 | exact ✓ |

Every deterministic estimate agrees to ≤ 1e-8; the stochastic bootstrap agrees to within
0.06% (well inside the 1% Monte-Carlo tolerance). The only nominal "difference" is the
Bayesian tail probability, where R's `pbeta` underflows to exactly 0 while SciPy returns
1.5e-77 — both are effectively zero. **The statistics are implementation-independent.**

## Why these should match

- **Mean, Cohen's d, Bayes, mSPRT** are deterministic closed-form computations on the same
  numbers → expected to agree to ~machine precision (1e-6 easily).
- **CUPED** is the R² of the same OLS design (cluster fixed effects + standardized
  description length); Python (`numpy.linalg.lstsq`) and R (`lm`) solve the identical normal
  equations → agreement to 1e-6.
- **Wilcoxon / t-test** use the same definitions; SciPy and base R differ only in tie/
  continuity handling, controlled here (`correct = FALSE`).
- **Bootstrap** is stochastic; with `set.seed(42)` and 10,000 resamples the BCa bounds agree
  to ~1% (different RNG streams across languages preclude exact equality — expected).

## Status

**Validated (2026-06-09).** The R pipeline was executed under R 4.5.3 with
`readr`/`dplyr`/`boot`/`pwr`; `analysis/r/compare.html` is the rendered notebook and the
table above is the real Python-vs-R comparison. Reproduce with:

```bash
quarto render analysis/r/compare.qmd            # -> analysis/r/compare.html
Rscript analysis/r/validate.R                   # prints the R column above
```

Any future deviation beyond the stated tolerances should be recorded here.
