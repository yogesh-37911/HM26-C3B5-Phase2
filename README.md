# FREQUENCY (ProofForge Cyber) · Verified Cybersecurity Talent & Evidence Pipeline

> **Hackathon Team ID:** `HM26-C3B5`  
> **Repository:** [https://github.com/yogesh-37911/HM26-C3B5-Phase2.git](https://github.com/yogesh-37911/HM26-C3B5-Phase2.git)  
> **Resource Index:** [resource.md](resource.md) | **AI Disclosure:** [ai.md](ai.md)  
> **Decision Log:** [docs/decision-log.md](docs/decision-log.md) | `output/pdf/HM26-C3B5_decision-log.pdf`

---

## 1. Problem Understanding

### Selected Sub-Problem: The Credential Inflation & Proof Gap in Cybersecurity Hiring
In technical hiring across Mysuru and the broader Indian engineering ecosystem, cybersecurity evaluation suffers from a fundamental trust deficit. Traditional resumes, multiple-choice certifications (e.g., CEH, Security+), and self-reported claimed tools reveal nothing about whether a candidate can systematically discover an authorization flaw, analyze impact, or communicate a defensible remediation. Recruiters face hundreds of inflated profiles, while high-capability candidates with hands-on lab depth struggle to stand out without brand-name credentials.

### What "Solved" Looks Like
A solved state replaces unverified claims with an **audited, end-to-end evidence pipeline**:
1. Candidates perform hands-on security tasks in contained labs (BOLA/IDOR, Reflected XSS, SQL Injection, Session Management) and undergo a strict 20-minute, 40-question technical baseline assessment.
2. Candidate findings and pentest reports (PDF/DOCX) undergo rigorous **human reviewer verification**, where reviewers score rubrics across 7 dimensions and challenge candidates through interactive technical defense questioning.
3. Every verified action generates an ungameable **9-domain Security DNA profile**, cleanly decoupling raw capability (0–100) from proof confidence (0–100%) and tracking historical finding accuracy.
4. Recruiters discover talent strictly through evidence thresholds, inspect sanitized reproduction proof (safe curl payloads with credentials redacted), and invite validated candidates to **Virtual Zoom** or **On-Spot In-Person Whiteboard** interviews with integrated venue mapping.

---

## 2. Target Users & Context

### Personas
- **The Candidate (e.g., Ananya Rao - Aspiring AppSec / PenTest Engineer):**  
  Practices in controlled security labs, uploads vulnerability documentation and proof artifacts, sits for timed technical assessments under non-stoppable countdown constraints, and responds to reviewer defense prompts.
- **The Reviewer (e.g., Samira Khan - Senior Security Auditor):**  
  Conducts evidence audits on submitted candidate findings, verifies reproduction steps, executes anti-collision SHA-256 integrity checks, evaluates defense answers, and certifies assessment scorecards. AI suggestions in the review console are strictly advisory.
- **The Recruiter (e.g., Jordan Davis - Security Engineering Hiring Lead):**  
  Searches pre-verified candidates using strict capability, confidence, and domain filters; inspects sanitized proof chains without viewing raw production secrets; and schedules interviews via Virtual Zoom or On-Spot Office sessions.

### Real Constraints Addressed
- **Device & Bandwidth Constraints:** Low-overhead React SPA with local-storage session failover and optimistic UI updates, ensuring flawless operation even over intermittent Tier-2/3 network connections.
- **Integrity & Anti-Gaming Constraints:** Strict non-stoppable 20-minute assessment timer stored in secure storage, server-side scoring where correct answer keys never leak to the client, and SHA-256 evidence hashing to flag collision attacks between cohorts.
- **Sanitization & Responsible Disclosure:** Automated redaction of authorization headers, tokens, and PII in recruiter views; contained synthetic lab targets preventing unauthorized scanning of external hosts.

---

## 3. Solution Overview

FREQUENCY operates as a coordinated 5-step evidence lifecycle across Candidate, Reviewer, and Recruiter workspaces:

```
[Candidate Lab / Test] ──> [Structured Evidence Upload] ──> [Reviewer Human Audit & Defense] ──> [Ungameable Security DNA] ──> [Recruiter Proof & Multi-Mode Invite]
```

1. **Step 1: Baseline Assessment & Hands-On Practice**  
   The candidate begins with a clean slate (0 capability score, 0 verified findings). They enter a proctored 40-question technical assessment across 4 core domains with a non-stoppable 20-minute countdown, establishing their initial capability baseline.
2. **Step 2: Structured Finding & Report Upload**  
   Candidates execute targeted testing in simulated environments (API Authorization BOLA, Reflected XSS, SQLi, Session Security). In the Reports section, candidates drag-and-drop industry-standard vulnerability reports (PDF/Word) or submit structured finding metadata (vulnerability component, reproduction steps, sanitized curl requests, and remediation advice).
3. **Step 3: Human Reviewer Audit & Interactive Defense**  
   Submissions enter the Reviewer queue. The reviewer inspects evidence integrity (SHA-256 hash collision checks), scores the finding across a 7-point rubric (Recon, Finding, Validation, Evidence, Impact, Remediation, Report Quality), and issues defense questions that the candidate must answer before verification.
4. **Step 4: Dynamic Security DNA & Proof Chain Computation**  
   Upon reviewer certification, the system calculates the candidate's 9-domain Security DNA. Capability score and proof confidence are computed mathematically, ensuring that candidates who pass both assessments and lab defenses achieve high proof confidence (90%+), while unverified accounts remain at 0.
5. **Step 5: Recruiter Discovery & Multi-Format Interview Scheduling**  
   Recruiters view top matched candidates dynamically. They inspect sanitized proof cards, review verified lab counts, and dispatch interview invitations. Recruiters can choose between **🌐 Online / Virtual Meeting (Zoom)** and **🏢 Offline / On-Spot Meeting (In-Person Office)** with automated Google Maps directions and room assignment.

---

## 4. Architecture

FREQUENCY is engineered as a responsive React 18 / TypeScript single-page application communicating via RESTful JSON APIs with a modular Flask 3 backend backed by PostgreSQL (with SQLite zero-setup dev fallback) and deterministic SHA-256 evidence hashing.

See [docs/architecture.md](docs/architecture.md) for full architectural specifications, component boundaries, and database schema.

---

## 5. Tech Stack & AI Usage

### Core Technologies
- **Frontend:** React 18, TypeScript, Vite 8, Lucide React, Vanilla CSS design system.
- **Backend:** Python 3.10+, Flask 3.x, Flask-SQLAlchemy 3.1, Flask-JWT-Extended, Flask-Limiter.
- **Database & Storage:** PostgreSQL 16 (production container) / SQLite 3 (local dev), SQLAlchemy ORM.
- **Deployment:** Render Blueprint (`render.yaml`), Docker Compose (`docker-compose.yml`).

### AI Usage Disclosure
See [ai.md](ai.md) for full disclosure. AI (Claude/Gemini) was used during development for code scaffolding, typing, and generating assessment question pools. **At runtime, no non-deterministic AI or LLM is in the critical decision loop.** The reviewer AI advisory is a deterministic template designed to assist human auditors; all verification, rubric scoring, and hiring decisions remain strictly human-driven.

---

## 6. Decision Log (Summary)

The one-page trade-off analysis is in [docs/decision-log.md](docs/decision-log.md) and [output/pdf/HM26-C3B5_decision-log.pdf](output/pdf/HM26-C3B5_decision-log.pdf). It compares deterministic API scoring and human review with an automated LLM grader, states the review-latency and integration costs we accept, and estimates scale from the actual four-section result model: 50,000 candidates imply 200,000 section submissions, or about 167 requests/second averaged across 20 minutes. This is an estimate, not a load-test result.

The 10-slide reviewer presentation is [output/pdf/HM26-C3B5_presentation.pdf](output/pdf/HM26-C3B5_presentation.pdf). It marks missing product captures and team member/college details as placeholders; add those before final submission. See [resource.md](resource.md) for submission links.
## 7. Setup & Run

### Quick Start (Local Development)

#### 1. Frontend Setup
```powershell
# In repository root
npm install
npm run dev
```
The client will launch at `http://localhost:5173`.

#### 2. Backend Setup
```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py app.py
```
The Flask API starts at `http://127.0.0.1:5000` with local SQLite initialized automatically.

#### 3. Seed Demo Accounts
```powershell
cd backend
py seed_demo.py
```
Pre-configures demo accounts (`Candidate`, `Reviewer`, `Recruiter`). Candidate `Ananya Rao` is seeded with a pristine clean slate (0 scores, 0 findings).

For PostgreSQL configuration, environment variables, and Docker Compose setup, see [docs/setup.md](docs/setup.md).

---

## 8. Known Limitations & Roadmap

### Top 3 Limitations
1. **Simulated Lab Targets:** Labs provide realistic HTTP request/response flows and guided attack surfaces, but do not provision isolated dynamic Docker containers per user.
2. **Regex-Based Proof Redaction:** Recruiter evidence sanitization uses pattern matching (JWTs, auth headers, email addresses) rather than an isolated NLP/DLP redaction engine.
3. **In-Memory Rate Limiting:** Rate limiting on assessment endpoints uses in-memory tracking; production multi-instance deployments require Redis-backed distributed limits.

See [docs/limitations.md](docs/limitations.md) for the complete engineering roadmap.
