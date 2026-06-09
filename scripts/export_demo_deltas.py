"""Export the demo paired-delta vector for cross-language (R) validation.

Runs the same DevOps-vs-DataScientist comparison the smoke demo uses and writes
``analysis/r/demo_deltas.csv`` so the R/Quarto notebook can rerun every test on
identical data. Also prints the Python reference statistics as JSON.

    ./.venv/bin/python scripts/export_demo_deltas.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd  # noqa: E402

from core.data import load_corpus  # noqa: E402
from core.scoring import compare_resumes  # noqa: E402
from stats.engine import analyze  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FIX = ROOT / "tests" / "fixtures" / "synthetic_resumes"
OUT = ROOT / "analysis" / "r" / "demo_deltas.csv"


def main() -> None:
    corpus = load_corpus()
    resume_a = (FIX / "devops_engineer.txt").read_text()
    resume_b = (FIX / "data_scientist.txt").read_text()
    scoring = compare_resumes(resume_a, resume_b, corpus)

    desc_len = corpus.jobs["description"].fillna("").str.len().to_numpy()
    pd.DataFrame({
        "delta": scoring.deltas,
        "score_a": scoring.scores_a,
        "score_b": scoring.scores_b,
        "cluster_id": scoring.cluster_ids,
        "cluster_label": scoring.cluster_labels,
        "desc_len": desc_len,
    }).to_csv(OUT, index=False)

    rep = analyze(scoring, corpus)
    reference = {
        "n": rep.n_jobs,
        "mean_delta": rep.scores_summary["mean_delta"],
        "primary_test": rep.primary_test.name,
        "t_or_w_stat": rep.primary_test.statistic,
        "p_value": rep.primary_test.pvalue,
        "cohens_d": rep.cohens_d,
        "boot_bca_low": rep.bootstrap.bca_low,
        "boot_bca_high": rep.bootstrap.bca_high,
        "cuped_variance_reduction": rep.cuped.variance_reduction,
        "bayes_k": rep.bayes.k,
        "bayes_prob_b": rep.bayes.prob_b_beats_a,
        "msprt_always_valid_p": rep.sequential.always_valid_p,
    }
    print(json.dumps(reference, indent=2))
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
