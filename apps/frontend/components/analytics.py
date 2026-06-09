"""PostHog product analytics — privacy-safe by construction.

Only event *metadata* is ever sent (file type, char count, effect size, p-value,
winner). Raw resume text never leaves the process. If ``POSTHOG_KEY`` is unset the
functions are silent no-ops, so the app runs fully without analytics.
"""

from __future__ import annotations

import os
from functools import lru_cache

# Canonical event names (see docs/business + PostHog plan).
EVENTS = {
    "app_loaded": "app_loaded",
    "resume_a_uploaded": "resume_a_uploaded",
    "resume_b_uploaded": "resume_b_uploaded",
    "comparison_run": "comparison_run",
    "verdict_revealed": "verdict_revealed",
    "methodology_toggled": "methodology_toggled",
    "per_cluster_sorted": "per_cluster_table_sorted",
    "pdf_downloaded": "pdf_report_downloaded",
}


@lru_cache(maxsize=1)
def _client():
    key = os.getenv("POSTHOG_KEY", "").strip()
    if not key:
        return None
    try:
        from posthog import Posthog

        return Posthog(
            project_api_key=key,
            host=os.getenv("POSTHOG_HOST", "https://us.i.posthog.com"),
        )
    except Exception:  # noqa: BLE001 - analytics must never break the app
        return None


def capture(distinct_id: str, event: str, properties: dict | None = None) -> None:
    """Best-effort event capture. Never raises; never sends resume content."""
    client = _client()
    if client is None:
        return
    try:
        client.capture(distinct_id=distinct_id, event=event, properties=properties or {})
    except Exception:  # noqa: BLE001
        pass
