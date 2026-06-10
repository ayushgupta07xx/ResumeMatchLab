#!/usr/bin/env bash
# Deploy the ResumeMatch Lab API to its Hugging Face Space (Docker SDK).
# Source of record for the live API; re-run any time to redeploy from main.
set -euo pipefail

SPACE_ID="ayushgupta7777/resumematch-api"
SPACE_DIR="${HOME}/code/resumematch-space"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Repo root: ${REPO_ROOT}"
echo "==> Space dir: ${SPACE_DIR}"

# 1. Clone the Space on first run (create it first at huggingface.co/new-space).
if [ ! -d "${SPACE_DIR}/.git" ]; then
  git clone "https://huggingface.co/spaces/${SPACE_ID}" "${SPACE_DIR}"
fi

cd "${SPACE_DIR}"
git lfs install
git lfs track "*.parquet"

# 2. Sync engine + data from main (exclude caches/venv/tests/docs).
for d in core stats parsers apps data embeddings; do
  rsync -a --delete --exclude '__pycache__' --exclude '*.pyc' \
    "${REPO_ROOT}/${d}/" "${SPACE_DIR}/${d}/"
done
cp "${REPO_ROOT}/requirements.txt" "${SPACE_DIR}/requirements.txt"

# 3. Root Dockerfile (paths root-relative; pre-bakes BGE so the first call is fast).
cat > Dockerfile <<'DOCKERFILE'
# ResumeMatch Lab API — Hugging Face Spaces (Docker SDK). Built from the Space root.
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/app/.hf_cache

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-bake the embedding model so the first /compare isn't a cold download.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en-v1.5')"

# Engine + API + committed corpus snapshot (no venv, tests, docs).
COPY core ./core
COPY stats ./stats
COPY parsers ./parsers
COPY apps ./apps
COPY data ./data
COPY embeddings ./embeddings

EXPOSE 7860
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "7860"]
DOCKERFILE

# 4. Space README front-matter (sdk: docker is authoritative for the Space type).
cat > README.md <<'README'
---
title: ResumeMatch Lab API
emoji: 📊
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
---

# ResumeMatch Lab API

A/B test two résumé variants against a 9,014-job snapshot of the Indian tech job
market. Sentence-transformer embeddings score each résumé against every job; a
full experimentation pipeline (bootstrap CIs, paired t-test / Wilcoxon, CUPED,
mSPRT, Bayesian Beta-Binomial, per-cluster multiple-comparison correction)
returns the verdict.

## Endpoints
- `GET /health` — liveness + corpus / model info
- `POST /compare` — multipart: two résumé files (PDF / DOCX / TXT) -> full report
- `POST /compare/text` — JSON `{resume_a, resume_b}` -> full report
- `GET /docs` — interactive OpenAPI docs

Built by Ayush Gupta · github.com/ayushgupta07xx
README

# 5. Commit + push -> HF auto-builds.
git add -A
git commit -m "Deploy ResumeMatch Lab API (engine + 9,014-job corpus)" || echo "(nothing to commit)"
git push

echo "==> Pushed. Watch the build:  https://huggingface.co/spaces/${SPACE_ID}"
echo "==> When green, verify:       https://ayushgupta7777-resumematch-api.hf.space/health"
