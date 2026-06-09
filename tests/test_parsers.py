from __future__ import annotations

import io

from parsers.resume import parse_resume


def test_raw_text_skills_and_scorable():
    r = parse_resume(raw_text="Senior Python developer with AWS and Kubernetes. " * 10)
    assert r.source_format == "text"
    assert r.is_scorable
    assert "python" in r.skills and "aws" in r.skills


def test_short_text_flagged():
    r = parse_resume(raw_text="too short")
    assert "too_short" in r.quality_flags
    assert not r.is_scorable


def test_txt_bytes():
    body = ("Data analyst skilled in SQL, Tableau and statistics. " * 8).encode()
    r = parse_resume(data=body, filename="resume.txt")
    assert r.source_format == "txt"
    assert "sql" in r.skills


def test_docx_roundtrip():
    from docx import Document

    doc = Document()
    for _ in range(8):
        doc.add_paragraph("Backend engineer with Java, Spring, microservices and Kafka.")
    buf = io.BytesIO()
    doc.save(buf)

    r = parse_resume(data=buf.getvalue(), filename="cv.docx")
    assert r.source_format == "docx"
    assert r.parser_used == "python-docx"
    assert "java" in r.skills and r.char_count > 200


def test_pdf_roundtrip():
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    y = 800
    for _ in range(12):
        c.drawString(40, y, "DevOps engineer: Docker, Terraform, AWS, Prometheus, CI/CD.")
        y -= 20
    c.showPage()
    c.save()

    r = parse_resume(data=buf.getvalue(), filename="cv.pdf")
    assert r.source_format == "pdf"
    assert r.char_count > 100
    assert "docker" in r.skills or "terraform" in r.skills
