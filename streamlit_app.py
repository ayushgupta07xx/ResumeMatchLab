"""Streamlit Community Cloud entry point.

Run locally with:  streamlit run streamlit_app.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from apps.frontend.app import main  # noqa: E402

main()
