import hashlib
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), "pdf", "HM26-C3B5_decision-log.pdf")
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    # 595.27 x 841.89 pt is A4
    # Margins 36 pt (0.5 inch) to comfortably fit on exactly 1 page
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=16,
        textColor=colors.HexColor('#1b4018'),
        spaceAfter=3
    )
    
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#486043'),
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'QuestionHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#1b4018'),
        spaceBefore=5,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=11.5,
        textColor=colors.HexColor('#222e20'),
        spaceAfter=4
    )
    
    story = []
    
    # Title & Metadata Header
    story.append(Paragraph("Engineering Decision Log — FREQUENCY (ProofForge Cyber)", title_style))
    story.append(Paragraph("<b>Team ID:</b> HM26-C3B5 &nbsp;|&nbsp; <b>Track:</b> Cybersecurity Talent & Evidence Pipeline &nbsp;|&nbsp; <b>Format:</b> 1-Page Engineering Audit", meta_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#275823'), spaceBefore=1, spaceAfter=5))
    
    # Q1
    story.append(Paragraph("<b>Q1. What approach did we take, and what did we reject?</b>", h2_style))
    q1_text = (
        "We built an audited, deterministic evidence pipeline coupled with human reviewer authority and decoupled capability/confidence scoring. "
        "<br/><b>Chosen Technical Pipeline:</b> "
        "Candidate raw HTTP lab payloads, drag-and-drop vulnerability reports (PDF/DOCX), and timed 40-question answers &rarr; "
        "SHA-256 evidence collision hashing + 7-dimensional reviewer rubric scoring + server-side non-linear 9-domain DNA weighting &rarr; "
        "Ungameable Security DNA, sanitized recruiter reproduction cards, and synchronized virtual/on-spot interview invitations. "
        "<br/><b>Rejected Alternative:</b> "
        "We considered and prototyped an automated LLM vulnerability grading pipeline using dynamic prompt chains to ingest exploit payloads and output instant scores. "
        "This looked attractive initially because it promised zero-human latency, 24/7 continuous scaling, and eliminated human auditor scheduling bottlenecks."
    )
    story.append(Paragraph(q1_text, body_style))
    
    # Q2
    story.append(Paragraph("<b>Q2. Why did we reject it? What was the trade-off?</b>", h2_style))
    q2_text = (
        "We rejected the automated LLM evaluator across four critical engineering dimensions: "
        "<br/><b>1. Prompt Injection Vulnerability:</b> Security exploit payloads inherently contain hostile characters (SQL quotes, script tags, serialized objects). Attackers trivially manipulate LLM evaluators via prompt injection within payloads to force automated 100/100 scores. "
        "<br/><b>2. Hallucination & Defensibility:</b> LLMs hallucinate CVE severity and cannot reliably distinguish legitimate authorization bypasses from superficial curl requests. In technical hiring, bad automated scores destroy employer trust. "
        "<br/><b>3. Build Predictability in 72h:</b> Non-deterministic prompt outputs make unit testing impossible; our relational schema and deterministic mathematical scoring engine delivered 100% reproducible, verifiable results. "
        "<br/><b>4. Recruiter Trust:</b> Hiring managers require verified reproduction curl commands and human auditor sign-off. "
        "<br/><b>Accepted Trade-off:</b> We knowingly accepted <b>asynchronous queue latency</b>. Candidates do not receive instant certification upon upload; they must wait for human auditor review and defense evaluation. We accepted this latency because compromised verification integrity is fatal."
    )
    story.append(Paragraph(q2_text, body_style))
    
    # Q3
    story.append(Paragraph("<b>Q3. What breaks at scale, and what is our architectural fix?</b>", h2_style))
    q3_text = (
        "At institutional scale (50,000 active candidates and 1,000 reviewers during synchronized regional assessment drives), the first critical bottleneck is <b>database write contention and table scans during synchronized assessment submissions</b>. "
        "When 50,000 candidates finish a 20-minute timed test concurrently, 2,000,000 individual row inserts hit <i>assessment_results</i> while triggering unindexed SHA-256 collision scans over historical findings. Under default PostgreSQL pooling (100–200 connections), this causes transaction serialization deadlocks, connection pool exhaustion, and request latency exceeding 30 seconds. "
        "<br/><b>Immediate Architectural Fix:</b> "
        "(1) Decouple submission ingestion via an asynchronous Redis Streams message queue with Celery workers performing bulk inserts (5,000 rows/batch). "
        "(2) Deploy an in-memory Redis Bloom Filter (&lt;15 MB RAM for 10M hashes at 0.1% false-positive rate) for O(1) duplicate collision pre-filtering prior to database writes. "
        "(3) Partition <i>submissions</i> and <i>assessment_results</i> by (candidate_id, section_id) with B-tree indexing on evidence hashes."
    )
    story.append(Paragraph(q3_text, body_style))
    
    doc.build(story)
    
    # Calculate SHA-256
    with open(pdf_path, 'rb') as f:
        sha256 = hashlib.sha256(f.read()).hexdigest().upper()
        
    print(f"PDF Generated successfully: {pdf_path}")
    print(f"SHA-256: {sha256}")
    return sha256

if __name__ == '__main__':
    generate_pdf()
