"""Helpers for stratified, per-cluster analysis of paired deltas."""

from __future__ import annotations

import numpy as np


def group_by_cluster(
    deltas: np.ndarray,
    cluster_ids: np.ndarray,
    cluster_names: dict[int, str],
) -> list[tuple[int, str, np.ndarray]]:
    """Return ``(cluster_id, label, deltas_in_cluster)`` for each cluster."""
    groups: list[tuple[int, str, np.ndarray]] = []
    for cid in sorted(cluster_names):
        mask = cluster_ids == cid
        groups.append((cid, cluster_names[cid], deltas[mask]))
    return groups
