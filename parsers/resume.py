"""Unified resume parser with a quality assessment and skill extraction.

Routes by file extension to the right backend (PDF -> DOCX -> plain text) or
accepts pasted text directly, normalizes whitespace, caps length, and surfaces
parse-quality flags so the UI can warn users before they trust a result.
"""

from __future__ import annotations

import re

from core.types import MIN_SCORABLE_CHARS, ResumeText
from parsers.docx import parse_docx
from parsers.pdf import parse_pdf
from parsers.plaintext import parse_txt

MAX_CHARS = 50_000  # hard cap (abuse + edge-case guard, per spec)

# Curated tech-skill vocabulary for lightweight extraction / guardrails.
SKILLS: frozenset[str] = frozenset({
    "python", "java", "javascript", "typescript", "golang", "c++", "scala", "rust",
    "sql", "bash", "r ", "kotlin", "swift", "react", "angular", "vue", "node",
    "django", "flask", "fastapi", "spring", "kubernetes", "docker", "terraform",
    "ansible", "aws", "gcp", "azure", "jenkins", "github actions", "gitlab",
    "prometheus", "grafana", "kafka", "spark", "hadoop", "airflow", "dbt",
    "snowflake", "bigquery", "postgresql", "mysql", "mongodb", "redis", "pandas",
    "numpy", "scikit-learn", "pytorch", "tensorflow", "transformers", "nlp",
    "machine learning", "deep learning", "xgboost", "tableau", "power bi", "excel",
    "a/b testing", "experimentation", "statistics", "regression", "etl",
    "data engineering", "data science", "product management", "agile", "scrum",
    "figma", "rest", "graphql", "microservices", "ci/cd", "mlflow", "llm",
})


def _extract_skills(text: str) -> list[str]:
    low = f" {text.lower()} "
    return sorted({s.strip() for s in SKILLS if s in low})


def _quality_score(text: str) -> float:
    """0..1 heuristic blending character sanity and length adequacy."""
    n = len(text)
    if n == 0:
        return 0.0
    sane = sum(c.isalnum() or c.isspace() or c in ".,/&()-+@#" for c in text) / n
    length_ok = min(n / 600.0, 1.0)
    return round(0.5 * sane + 0.5 * length_ok, 3)


def parse_resume(
    *,
    data: bytes | None = None,
    filename: str | None = None,
    raw_text: str | None = None,
) -> ResumeText:
    """Parse an uploaded file (``data`` + ``filename``) or pasted ``raw_text``."""
    if raw_text is not None:
        text, fmt, parser = raw_text, "text", "textarea"
    elif data is not None:
        ext = (filename or "").lower().rsplit(".", 1)[-1]
        if ext == "pdf":
            text, parser = parse_pdf(data)
            fmt = "pdf"
        elif ext in ("docx", "doc"):
            text, parser = parse_docx(data)
            fmt = "docx"
        else:
            text, parser = parse_txt(data)
            fmt = "txt"
    else:
        raise ValueError("parse_resume needs either `data` or `raw_text`.")

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    flags: list[str] = []
    if len(text) < MIN_SCORABLE_CHARS:
        flags.append("too_short")
    quality = _quality_score(text)
    if quality < 0.5:
        flags.append("low_quality_parse")

    return ResumeText(
        text=text,
        char_count=len(text),
        source_format=fmt,
        parse_quality=quality,
        parser_used=parser,
        quality_flags=flags,
        skills=_extract_skills(text),
    )
