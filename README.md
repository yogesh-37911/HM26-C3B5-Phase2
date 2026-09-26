# ProofForge Cyber

## 1. Problem Understanding

Cybersecurity hiring often relies on certificates and self-reported tools, which say little about how a person validates a vulnerability or communicates a fix. ProofForge Cyber turns authorized lab work into reviewable evidence: candidates document findings, reviewers verify them, and recruiters inspect the proof behind capability signals.

## 2. Target Users & Cybersecurity Context

Candidates practice in controlled training labs and build a finding portfolio. Reviewers inspect evidence, ask questions, and retain final score authority. Recruiters discover candidates through verified capability. All practical examples are restricted to explicitly authorized, isolated training targets. Demo profiles and records are synthetic.

## 3. Solution Overview

1. Candidate selects a lab and reviews safe tool references.
2. Candidate documents a vulnerability, evidence, reproduction, impact and remediation.
3. A reviewer requests a technical defense, evaluates the answers and independently verifies or rejects the finding.
4. Verified work and server-scored assessments contribute to the nine-domain Security DNA with separate capability and proof-confidence values.
5. Recruiters set evidence thresholds, see why a candidate matches, inspect sanitized proof and send interview invitations.

Screenshots: the MVP includes a live responsive interface; run it using `npm run dev` and capture the candidate dashboard and recruiter discovery views for a presentation. No pre-rendered screenshot is represented as a running product capture.

## 4. Architecture

ProofForge is a React client backed by a modular Flask API and PostgreSQL data store. See [docs/architecture.md](docs/architecture.md).

The Security DNA, defense and recruiter proof endpoints are documented in [docs/api.md](docs/api.md).

Secure Assessment Mode adds explicit browser permission consent, candidate camera preview, browser screen capture, fullscreen and focus/visibility monitoring, server-side security events, assigned-reviewer monitoring and peer-to-peer WebRTC. Setup, target-scope rules, TURN, privacy, and managed kiosk/network architecture are in [docs/secure-assessment.md](docs/secure-assessment.md).

## 5. Tech Stack & AI Usage

React, Vite, TypeScript, Flask, SQLAlchemy, PostgreSQL, JWT, Docker Compose for local data services. The review console contains a deterministic illustrative AI advisory; it does not call an AI service or make verification or hiring decisions. See [ai.md](ai.md).

## 6. Decision Log (Summary)

One modular API and a controlled demo workflow keep the hackathon build understandable. A contained training-target placeholder is used instead of a user-controlled arbitrary scanner or public vulnerable deployment. See [resource.md](resource.md).

## 7. Setup & Run

Requires Node.js 20+, Python 3.10+, and optionally Docker Desktop for PostgreSQL.

```powershell
npm install
npm run dev
```

In another terminal:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py app.py
```

The API uses SQLite for zero-setup local demonstration. To use PostgreSQL, start `docker compose up -d db`, copy `.env.example` to `.env`, and set `DATABASE_URL`, a private `JWT_SECRET_KEY`, and a 12+ character private `DEMO_PASSWORD` (or role-specific demo passwords). Seed accounts with `python seed_demo.py` in `backend`. See [docs/setup.md](docs/setup.md).

### Deploy from GitHub to Render

Push the repository to GitHub, then create a **Blueprint** in Render and select that repository. The root [render.yaml](render.yaml) defines the static frontend, Flask API, and PostgreSQL database. After deployment, check the API service's `/api/health` route and open the static-site URL. Authentication, candidate scores, and Secure Assessment Mode use the API; other existing workspace areas still contain synthetic demonstration data. See [docs/deployment.md](docs/deployment.md).

The login page uses role-scoped API authentication. Demo workspace data remains synthetic except where the UI explicitly saves records to the API.

## 8. Known Limitations

Labs are contained training-flow demonstrations, not provisioned vulnerable Docker targets. WebRTC uses direct peer media and needs an organization TURN service for some network topologies. Browser controls do not provide OS-level kiosk lockdown. See [Secure Assessment Mode](docs/secure-assessment.md) and the [limitations and roadmap](docs/limitations.md) before production use.
