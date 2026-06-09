"""PDF text extraction: pdfplumber primary, pymupdf fallback."""

from __future__ import annotations

import io


def parse_pdf(data: bytes) -> tuple[str, str]:
    """Return ``(text, parser_used)`` using pdfplumber, falling back to pymupdf."""
    text = ""
    try:
        import pdfplumber

        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        if len(text.strip()) >= 50:
            return text.strip(), "pdfplumber"
    except Exception:  # noqa: BLE001 - try the fallback parser
        pass

    try:
        import fitz  # pymupdf

        with fitz.open(stream=data, filetype="pdf") as doc:
            text = "\n".join(page.get_text() for page in doc)
        return text.strip(), "pymupdf-fallback"
    except Exception:  # noqa: BLE001
        return text.strip(), "pdf-failed"
