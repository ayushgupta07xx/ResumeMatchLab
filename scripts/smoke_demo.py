"""End-to-end smoke test with the REAL BGE model and two synthetic resumes.

Validates the full path (parse-free text -> embed -> score -> analyze) and
prints the verdict plus per-cluster breakdown. First run downloads the model.

    ./.venv/bin/python scripts/smoke_demo.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.data import load_corpus  # noqa: E402
from core.scoring import compare_resumes  # noqa: E402
from stats.engine import analyze  # noqa: E402

FIX = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "synthetic_resumes"


def main() -> None:
    corpus = load_corpus()
    resume_a = (FIX / "devops_engineer.txt").read_text()
    resume_b = (FIX / "data_scientist.txt").read_text()

    scoring = compare_resumes(resume_a, resume_b, corpus)
    rep = analyze(scoring, corpus)
    s = rep.scores_summary

    print("=" * 70)
    print("VERDICT:", rep.verdict.headline)
    print(f"  winner={rep.verdict.winner}  confidence={rep.verdict.confidence}")
    print("-" * 70)
    print(
        f"mean score  A={s['mean_a']:.4f}  B={s['mean_b']:.4f}  "
        f"delta={s['mean_delta']:+.4f}  (B wins {s['pct_jobs_b_wins']:.1f}% of jobs)"
    )
    print(
        f"effect      Cohen d={rep.cohens_d:.3f}  achieved power={rep.achieved_power:.3f}  "
        f"required N@80%={rep.required_n_80:.0f}"
    )
    print(
        f"bootstrap   BCa 95% CI [{rep.bootstrap.bca_low * 100:+.2f}, "
        f"{rep.bootstrap.bca_high * 100:+.2f}] points"
    )
    print(
        f"CUPED       variance reduction={rep.cuped.variance_reduction * 100:.1f}%  "
        f"(effective N x{rep.cuped.effective_n_multiplier:.2f})"
    )
    print(
        f"mSPRT       always-valid p={rep.sequential.always_valid_p:.3g}  "
        f"reject H0={rep.sequential.reject_h0}"
    )
    print(
        f"Bayes       P(B>A per job)={rep.bayes.prob_b_beats_a:.3f}  "
        f"95% CrI [{rep.bayes.ci_low:.3f}, {rep.bayes.ci_high:.3f}]"
    )
    print("-" * 70)
    print("Per-cluster (BH-FDR corrected):")
    view = rep.per_cluster[["label", "n", "mean_delta", "p_bh_fdr", "winner"]].copy()
    view["mean_delta"] = (view["mean_delta"] * 100).round(2)
    view["p_bh_fdr"] = view["p_bh_fdr"].round(4)
    print(view.to_string(index=False))
    print("=" * 70)


if __name__ == "__main__":
    main()
