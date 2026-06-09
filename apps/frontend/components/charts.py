"""Plotly figures for the results page: forest plot, distributions, posterior,
and the mSPRT trajectory."""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

A_COLOR = "#dc2626"  # red — Resume A
B_COLOR = "#16a34a"  # green — Resume B
NS_COLOR = "#9ca3af"  # grey — not significant
WIN_COLOR = {"B": B_COLOR, "A": A_COLOR, "tie": NS_COLOR, "n/a": NS_COLOR}
WIN_LABEL = {"B": "B wins", "A": "A wins", "tie": "n.s.", "n/a": "n.s."}


def forest_plot(per_cluster: pd.DataFrame) -> go.Figure:
    """Per-cluster mean delta (B - A) with 95% CI whiskers, colored by winner."""
    df = per_cluster.dropna(subset=["mean_delta", "ci_low", "ci_high"]).copy()
    df = df.sort_values("mean_delta")
    fig = go.Figure()
    for winner, sub in df.groupby("winner"):
        fig.add_trace(
            go.Scatter(
                x=sub["mean_delta"] * 100,
                y=sub["label"],
                mode="markers",
                name=WIN_LABEL.get(winner, winner),
                marker=dict(color=WIN_COLOR.get(winner, NS_COLOR), size=11),
                error_x=dict(
                    type="data",
                    symmetric=False,
                    array=(sub["ci_high"] - sub["mean_delta"]) * 100,
                    arrayminus=(sub["mean_delta"] - sub["ci_low"]) * 100,
                    color=WIN_COLOR.get(winner, NS_COLOR),
                    thickness=1.5,
                ),
                hovertemplate="%{y}<br>Δ=%{x:.2f} pts<extra></extra>",
            )
        )
    fig.add_vline(x=0, line_dash="dash", line_color="#6b7280")
    fig.update_layout(
        title=dict(
            text="Where each résumé matches better — by job cluster",
            x=0,
            xanchor="left",
            font=dict(size=15),
        ),
        xaxis_title="← Resume A matches better          Resume B matches better →",
        yaxis_title="",
        height=440,
        margin=dict(l=10, r=10, t=44, b=72),
        legend=dict(orientation="h", yanchor="top", y=-0.22, x=0),
    )
    return fig


def score_distributions(scores_a: np.ndarray, scores_b: np.ndarray) -> go.Figure:
    """Overlaid histograms of cosine match scores for A vs B."""
    fig = go.Figure()
    fig.add_trace(
        go.Histogram(x=scores_a, name="Resume A", opacity=0.6, nbinsx=50, marker_color=A_COLOR)
    )
    fig.add_trace(
        go.Histogram(x=scores_b, name="Resume B", opacity=0.6, nbinsx=50, marker_color=B_COLOR)
    )
    fig.update_layout(
        barmode="overlay",
        title=dict(
            text=f"Match-score distribution across {len(scores_a):,} jobs",
            x=0,
            xanchor="left",
            font=dict(size=15),
        ),
        xaxis_title="Cosine similarity",
        yaxis_title="jobs",
        height=380,
        margin=dict(l=10, r=10, t=44, b=58),
        legend=dict(orientation="h", yanchor="top", y=-0.32, x=0),
    )
    return fig


def bayesian_posterior(bayes) -> go.Figure:
    """Beta posterior of p = P(B beats A on a job), with shaded 95% CrI."""
    xs, pdf = bayes.posterior_pdf()
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=xs, y=pdf, mode="lines", line_color="#2563eb", name="posterior"))
    mask = (xs >= bayes.ci_low) & (xs <= bayes.ci_high)
    fig.add_trace(
        go.Scatter(
            x=xs[mask],
            y=pdf[mask],
            fill="tozeroy",
            mode="none",
            fillcolor="rgba(37,99,235,0.20)",
            name="95% CrI",
        )
    )
    fig.add_vline(
        x=0.5,
        line_dash="dash",
        line_color=A_COLOR,
        annotation_text="p = 0.5",
        annotation_position="top",
    )
    fig.update_layout(
        title=f"P(B beats A on a job) — P(p>0.5) = {bayes.prob_b_beats_a:.3f}",
        xaxis_title="p = fraction of jobs where B scores higher",
        yaxis_title="density",
        height=340,
        margin=dict(l=10, r=10, t=50, b=10),
        showlegend=False,
    )
    return fig


def sequential_trajectory(seq) -> go.Figure:
    """Always-valid p-value as the jobs accumulate (log scale)."""
    n = np.arange(1, seq.n + 1)
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=n,
            y=np.clip(seq.trajectory_p, 1e-300, 1.0),
            mode="lines",
            line_color="#7c3aed",
            name="always-valid p",
        )
    )
    fig.add_hline(y=0.05, line_dash="dash", line_color=A_COLOR, annotation_text="α = 0.05")
    fig.update_layout(
        title="mSPRT always-valid p-value as jobs accumulate",
        xaxis_title="jobs scored (n)",
        yaxis_title="always-valid p",
        yaxis_type="log",
        height=320,
        margin=dict(l=10, r=10, t=50, b=10),
        showlegend=False,
    )
    return fig
