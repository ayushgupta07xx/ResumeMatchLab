"""Shared test fixtures: synthetic deltas and a deterministic fake embedder."""

from __future__ import annotations

import hashlib

import numpy as np
import pytest


def make_deltas(mu: float, sigma: float, n: int, seed: int = 0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.normal(mu, sigma, n)


@pytest.fixture
def deltas_positive() -> np.ndarray:
    # Clear positive effect: d = mu/sigma = 0.3.
    return make_deltas(0.03, 0.10, 2000, seed=42)


@pytest.fixture
def deltas_null() -> np.ndarray:
    return make_deltas(0.0, 0.10, 2000, seed=7)


@pytest.fixture
def deltas_skewed() -> np.ndarray:
    rng = np.random.default_rng(3)
    return rng.exponential(0.05, 2000) - 0.05  # right-skewed, mean ~0


def fake_embedder(dim: int = 384):
    """Deterministic text -> unit vector, no transformer model required."""

    def embed(text: str) -> np.ndarray:
        seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        v = rng.standard_normal(dim).astype(np.float32)
        return v / np.linalg.norm(v)

    return embed
