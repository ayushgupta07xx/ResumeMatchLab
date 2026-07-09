import type { CompareResponse, FitResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function handle(res: Response): Promise<CompareResponse> {
  if (!res.ok) {
    let detail = `The comparison failed (${res.status}). Try again in a moment.`;
    try {
      const j = await res.json();
      if (j?.detail) detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return (await res.json()) as CompareResponse;
}

/** Compare two resumes provided as plain text (JSON endpoint). */
export async function compareText(resume_a: string, resume_b: string) {
  const res = await fetch(`${BASE}/compare/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_a, resume_b }),
  });
  return handle(res);
}

/** Compare two uploaded resume files (PDF / DOCX / TXT) via multipart. */
export async function compareFiles(fileA: File, fileB: File) {
  const fd = new FormData();
  fd.append("resume_a", fileA);
  fd.append("resume_b", fileB);
  const res = await fetch(`${BASE}/compare`, { method: "POST", body: fd });
  return handle(res);
}

async function handleFit(res: Response): Promise<FitResponse> {
  if (!res.ok) {
    let detail = `The fit scoring failed (${res.status}). Try again in a moment.`;
    try {
      const j = await res.json();
      if (j?.detail) detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return (await res.json()) as FitResponse;
}

/** Score a single résumé provided as plain text (JSON endpoint). */
export async function fitText(resume: string) {
  const res = await fetch(`${BASE}/fit/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume }),
  });
  return handleFit(res);
}

/** Score a single uploaded résumé file (PDF / DOCX / TXT) via multipart. */
export async function fitFile(file: File) {
  const fd = new FormData();
  fd.append("resume", file);
  const res = await fetch(`${BASE}/fit`, { method: "POST", body: fd });
  return handleFit(res);
}
