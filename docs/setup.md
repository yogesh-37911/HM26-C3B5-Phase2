# Setup

## Frontend

Requires Node.js 20+.

```powershell
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). Set `VITE_API_BASE_URL=http://localhost:5000` in the frontend environment if the API is on another origin. Secure Assessment camera/screen permissions work on localhost; use a supported browser and grant permission explicitly.

## API

Requires Python 3.10+.

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py app.py
```

API health: `GET http://127.0.0.1:5000/api/health`. SQLite is created locally by default.

To seed clearly synthetic API users (3 candidates, 2 reviewers, 2 recruiters), separate candidate assessment histories, and example findings, set `DEMO_PASSWORD` to a private value of at least 12 characters, then run `py seed_demo.py` from `backend`. All three candidates share that password. Alternatively, set `DEMO_CANDIDATE_PASSWORD`, `DEMO_REVIEWER_PASSWORD`, and `DEMO_RECRUITER_PASSWORD` separately. There is no hardcoded demo password. Candidate sign-ins are `ananya.demo@example.invalid`, `rohan.demo@example.invalid`, and `maya.demo@example.invalid`; the candidate picker is on the login page. Do not use demo accounts in production.

The secure assessment reviewer defaults to `samira.demo@example.invalid`; change `SECURE_ASSESSMENT_REVIEWER_EMAIL` to assign new candidate sessions to another provisioned reviewer. Start the app over HTTP on localhost for local browser capture; non-local deployments must use HTTPS. Default targets include Gruyere and Acunetix's intentionally vulnerable test site; Hack Mysuru is disabled until its operator grants explicit written testing scope. See [secure-assessment.md](secure-assessment.md) for the permission checklist, reviewer console, WebRTC/TURN setup, policy configuration, retention, and managed-kiosk architecture.

## PostgreSQL

Copy `.env.example` to `.env` in the repository root, edit the secret values, then start `docker compose up -d db`. Set `DATABASE_URL=postgresql+psycopg://proofforge:change-me@localhost:5432/proofforge`. The compose password is for local demonstration only.

## Demo path

After signing in as Candidate, open Security Labs → Broken Authentication → Start Lab → submit a finding from Findings. Sign out and use the Reviewer and Recruiter accounts to explore their workspaces. All UI records are synthetic demonstration state.
