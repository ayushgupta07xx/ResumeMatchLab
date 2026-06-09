# ResumeMatch Lab API — Hugging Face Spaces (Docker SDK).
# Build from the REPO ROOT so the snapshot + engine are in context:
#   docker build -f apps/api/Dockerfile -t resumematch-api .
#   docker run -p 7860:7860 resumematch-api
# On HF Spaces, place this Dockerfile at the Space repo root (or use a Space that
# builds it) and set the Space SDK to "docker"; it listens on 7860.
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/app/.hf_cache

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Only the engine + API + committed data snapshot (no venv, tests, docs).
COPY core ./core
COPY stats ./stats
COPY parsers ./parsers
COPY apps ./apps
COPY data ./data
COPY embeddings ./embeddings

EXPOSE 7860
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "7860"]
