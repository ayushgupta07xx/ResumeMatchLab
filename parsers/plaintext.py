"""Plain-text decoding with an encoding fallback chain."""

from __future__ import annotations


def parse_txt(data: bytes) -> tuple[str, str]:
    """Return ``(text, parser_used)`` decoding bytes as UTF-8 then latin-1."""
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding).strip(), "plaintext"
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore").strip(), "plaintext-lossy"
