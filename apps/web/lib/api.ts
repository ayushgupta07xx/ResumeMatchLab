import type { CompareResponse } from "./types";

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
