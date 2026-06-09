"""Render the methodology case study to PDF.

The source Markdown keeps nice Unicode math symbols (great on GitHub), but
tectonic's default fonts lack glyphs for Greek / operators used in *prose and
inline code*. The LaTeX math blocks ($$...$$) are already pure-ASCII LaTeX, so
they are unaffected. We sanitize only the stray Unicode into ASCII in a throwaway
copy and render that.

    ~/rrenv/bin/python is not needed; run with the project venv:
    ./.venv/bin/python scripts/render_case_study.py
"""

from __future__ import annotations

import subprocess
from pathlib import Path

HOME = Path.home()
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "methodology" / "case_study.md"
TMP = ROOT / "docs" / "methodology" / "_case_study.render.md"
PDF = ROOT / "docs" / "methodology" / "case_study.pdf"

PANDOC = str(HOME / "rrenv" / "bin" / "pandoc")
TECTONIC = str(HOME / "rrenv" / "bin" / "tectonic")

# Unicode -> ASCII for symbols that appear in prose / inline-code (not in the
# ASCII-LaTeX math blocks, which are left untouched).
REPL = {
    "−": "-", "×": "x", "·": ".", "≈": "~=", "≥": ">=", "≤": "<=",
    "√": "sqrt ", "≠": "!=", "→": "->",
    "α": "alpha", "β": "beta", "μ": "mu", "σ": "sigma", "τ": "tau",
    "ρ": "rho", "θ": "theta", "η": "eta", "ε": "eps", "λ": "lambda",
    "Φ": "Phi", "Λ": "Lambda", "Δ": "Delta",
    "²": "^2", "³": "^3", "₀": "_0", "₁": "_1", "₂": "_2",
}


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    for uni, ascii_ in REPL.items():
        text = text.replace(uni, ascii_)
    TMP.write_text(text, encoding="utf-8")

    result = subprocess.run(
        [PANDOC, str(TMP), "-o", str(PDF), f"--pdf-engine={TECTONIC}",
         "-V", "geometry:margin=1in"],
        capture_output=True, text=True,
    )
    print("STDOUT:", result.stdout[-1500:])
    print("STDERR:", result.stderr[-2500:])
    print("returncode:", result.returncode)
    if result.returncode == 0:
        TMP.unlink(missing_ok=True)
        size = PDF.stat().st_size
        print(f"OK -> {PDF} ({size:,} bytes)")
    else:
        print(f"FAILED — sanitized source kept at {TMP} for inspection")


if __name__ == "__main__":
    main()
