# GitHub → Render deployment

The root [render.yaml](../render.yaml) is a Render Blueprint that provisions:

- A static Vite frontend (`proofforge-cyber`).
- A Flask/Gunicorn API (`proofforge-api`) with a `/api/health` check.
- A managed PostgreSQL database (`proofforge-db`).

## Deploy steps

1. Push the repository to a GitHub repository you control.
2. In Render, create a new Blueprint and connect that GitHub repository.
3. Review the resources and deploy the Blueprint. Render generates `JWT_SECRET_KEY` and wires the API to PostgreSQL.
4. Open the API URL at `/api/health`, then open the static-site URL. The Blueprint creates three private, generated demo passwords and seeds synthetic accounts on API startup.

The Blueprint assumes Render assigns `https://proofforge-cyber.onrender.com` to the static site and `https://proofforge-api.onrender.com` to the API. If you rename either service or add a custom domain, update `FRONTEND_ORIGIN`, the static site's `VITE_API_BASE_URL`, and its Content-Security-Policy `connect-src` to match. Redeploy both services after changing them.

## Secure Assessment Mode on Render

The API start command uses one Gunicorn `gthread` worker (100 threads) for Flask-SocketIO/WebSocket connections. Keep it at one worker unless you add a shared Socket.IO message queue and validate routing/session behavior. Render TLS provides secure browser contexts and WSS. The static-site security headers allow camera, microphone, display capture, fullscreen, API/WebSocket signaling, and WebRTC ICE connections.

Set `SECURE_ASSESSMENT_REVIEWER_EMAIL` to the reviewer account assigned to new sessions. `STUN_URL` is configured for basic ICE discovery. Set `TURN_URL` and `TURN_SHARED_SECRET` as private API environment values to enable TURN REST credentials; use a coturn-compatible shared-secret configuration. The secret never goes into the static Vite bundle. Without TURN, some candidates/reviewers behind restrictive NAT or corporate firewalls may not get a media path. Set the fallback HTTPS meeting URL in the reviewer Secure Assessments policy when a fallback is needed.

The reviewer Secure Assessments workspace configures allowed targets and candidate-visible resource rules. Newly added targets start disabled. Configure real browser kiosk policy and network/DNS/proxy egress allowlisting separately; frontend policy checkboxes do not enforce network restrictions. Google Gruyere and Acunetix Test ASP.NET are enabled demo labs; Hack Mysuru remains disabled pending its operator's written authorization and scope. See [secure-assessment.md](secure-assessment.md) for privacy, consent, browser limitations, event retention, and rollout details.

## Demo sign-in accounts

The sign-in screen includes these synthetic accounts:

| Workspace | Email |
| --- | --- |
| Candidate — Ananya Rao | `ananya.demo@example.invalid` |
| Candidate — Rohan Mehta | `rohan.demo@example.invalid` |
| Candidate — Maya Iyer | `maya.demo@example.invalid` |
| Reviewer | `samira.demo@example.invalid` |
| Recruiter | `jordan.demo@example.invalid` |

All three candidate accounts share `DEMO_CANDIDATE_PASSWORD`; the reviewer and recruiter use `DEMO_REVIEWER_PASSWORD` and `DEMO_RECRUITER_PASSWORD`. Render generates these private values; view them in the API service's environment settings and use the candidate password for each candidate email. Never publish these values or reuse them for a real account. Candidate findings and assessment scores are stored per account. Locally, set `DEMO_PASSWORD` to one private value before running `python seed_demo.py` from `backend` to use the same password for all demo accounts.

The Blueprint uses Free plans for a hackathon demo. Render's current Free Postgres databases expire 30 days after creation, and Free web services spin down when idle; upgrade the database or export any records you need to keep beyond the demo window. See Render's [Free instance limitations](https://render.com/docs/free).

## What is hosted

The sign-in flow authenticates against the Flask API. Passwords are stored as scrypt hashes, role selection is based on the server's account record, login attempts are rate limited, and sign-out revokes the current access token. Access tokens live in browser session storage for up to four hours. Candidate proof metrics and assessment scores persist to PostgreSQL per account; unfinished question-by-question progress is saved in that browser under the candidate's email. Other workspace actions remain synthetic and browser-local.

The API database is initialized with SQLAlchemy `create_all` at service startup. This creates new tables but is not a versioned migration system. Back up data and use proper migrations before schema changes on a database with records.

## Before real use

- Move bearer tokens to secure, HttpOnly cookies before handling sensitive production data; session storage is exposed to any successful same-origin script injection.
- Connect remaining workspace actions to API authentication and persisted candidate/reviewer/recruiter flows.
- Replace the simple in-memory rate-limit backend with shared storage before running multiple instances.
- Add a reviewed secure evidence storage/redaction design and operational monitoring.
- Provision isolated, egress-restricted lab containers before enabling hands-on security testing.
- Review database backup/retention and the selected Render plan for the expected lifetime and availability needs.
