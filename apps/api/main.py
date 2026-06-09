"""ResumeMatch Lab — FastAPI backend.

Endpoints:
  GET  /health         — liveness + corpus/model info
  POST /compare        — multipart: two resume files (or form text) -> full report
  POST /compare/text   — JSON: {resume_a, resume_b} plain text -> full report

Reuses the same engine as the Streamlit app (core/ + stats/), so both UIs share
one source of truth. Deploy on Hugging Face Spaces (Docker) — see apps/api/Dockerfile.
"""

from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi import FastAPI, File, Form, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from apps.api.serialize import report_to_dict  # noqa: E402
from core.data import MODEL_NAME, load_corpus  # noqa: E402
from core.scoring import compare_resumes  # noqa: E402
from core.types import MIN_SCORABLE_CHARS, ResumeText  # noqa: E402
from parsers.resume import parse_resume  # noqa: E402
from stats.engine import analyze  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_corpus()  # warm the corpus cache so the first request is fast
    yield


app = FastAPI(
    title="ResumeMatch Lab API",
    version="1.0.0",
    description="A/B test two resume variants against the full Indian tech job corpus.",
    lifespan=lifespan,
)

_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins or ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=False,
)


class TextPair(BaseModel):
    resume_a: str
    resume_b: str


def _run(a: ResumeText, b: ResumeText) -> dict:
    if not a.is_scorable or not b.is_scorable:
        raise HTTPException(
            status_code=422,
            detail=f"A resume parsed to under {MIN_SCORABLE_CHARS} characters; "
            "cannot score. Please provide fuller text.",
        )
    corpus = load_corpus()
    scoring = compare_resumes(a, b, corpus)
    report = analyze(scoring, corpus)
    return report_to_dict(report, scoring, a, b)


async def _resume_from(file: UploadFile | None, text: str | None, slot: str) -> ResumeText:
    if file is not None:
        data = await file.read()
        if data:
            return parse_resume(data=data, filename=file.filename)
    if text and text.strip():
        return parse_resume(raw_text=text)
    raise HTTPException(status_code=422, detail=f"Provide resume {slot} as a file or text.")


@app.get("/health")
def health() -> dict:
    corpus = load_corpus()
    return {
        "status": "ok",
        "n_jobs": corpus.n_jobs,
        "n_clusters": corpus.n_clusters,
        "model": MODEL_NAME,
        "clusters": list(corpus.cluster_names.values()),
    }


@app.post("/compare")
async def compare(
    resume_a: UploadFile | None = File(default=None),
    resume_b: UploadFile | None = File(default=None),
    resume_a_text: str | None = Form(default=None),
    resume_b_text: str | None = Form(default=None),
) -> dict:
    a = await _resume_from(resume_a, resume_a_text, "A")
    b = await _resume_from(resume_b, resume_b_text, "B")
    return _run(a, b)


@app.post("/compare/text")
def compare_text(body: TextPair) -> dict:
    return _run(parse_resume(raw_text=body.resume_a), parse_resume(raw_text=body.resume_b))
