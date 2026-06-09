"""Capture committed screenshots of the running app (demo mode).

Run with the Playwright conda env against a Streamlit server on :8520:
    micromamba run -n pw python scripts/_screenshot.py
"""

from __future__ import annotations

import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "images"
URL = "http://127.0.0.1:8520/?demo=1"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 2400})
        page.goto(URL, wait_until="domcontentloaded", timeout=90000)
        # Wait for the demo to compute and the verdict to render.
        try:
            page.wait_for_selector("text=wins by", timeout=90000)
        except Exception:
            time.sleep(25)
        time.sleep(4)  # let Plotly charts finish drawing
        page.screenshot(path=str(OUT / "app_results.png"), full_page=True)
        page.set_viewport_size({"width": 1440, "height": 900})
        page.screenshot(path=str(OUT / "app_hero.png"), full_page=False)
        browser.close()
    print("screenshots written to", OUT)


if __name__ == "__main__":
    main()
