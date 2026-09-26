# API additions

All routes are under `/api`, use the existing JWT bearer token and preserve the candidate/reviewer/recruiter roles.

## Authentication

- `POST /auth/login` accepts `{ "email": "...", "password": "..." }` and returns a short-lived bearer token and the account's server-assigned role. Passwords are verified against scrypt hashes; login attempts are rate-limited.
- `GET /auth/me` returns the authenticated account identity and role.
- `POST /auth/logout` revokes the current access token. Send it as `Authorization: Bearer <token>`.
- `POST /auth/register` creates candidate accounts only. Reviewer and recruiter accounts must be provisioned by an administrator.

## Candidate proof and Security DNA

- `GET /candidate/security-dna` — nine evidence-based domains, capability, proof confidence, verified finding accuracy, false positives, duplicate/suspicion signals, completeness and reviewer scores.
- `GET /candidate/proof` — the authenticated candidate's own finding chain.
- `GET /candidate/progress` — the authenticated candidate's own proof metrics and saved assessment results.
- `GET /candidate/recommendations` — deterministic next-lab suggestion based on the lowest measured skill; this is advisory only.

## Finding defense

- `POST /submissions/{id}/defense` (reviewer) with `{ "question": "..." }` stores a reviewer-authored prompt.
- `GET /submissions/{id}/defense` (candidate owner or reviewer) returns the prompts and responses.
- `PATCH /defense/{question_id}/answer` (owning candidate) with `{ "answer": "..." }` submits an answer once.
- `PATCH /defense/{question_id}/evaluate` (reviewer) with `{ "score": 0..100, "note": "..." }` records a human score separately from the finding score.
- `POST /submissions/{id}/review` (reviewer) continues to own finding verification and final score; optional `report_quality` and `evidence_consistency` rubric values are bounded 0–100.

## Recruiter discovery and proof

- `GET /recruiter/candidates?skill=API%20Security&min_skill=75&min_capability=80&min_proof_confidence=80&min_accuracy=85` matches verified platform evidence only. Unverified tool claims are excluded. Responses include `why_matched`.
- `GET /recruiter/candidates/{candidate_id}/proof` returns the skill fingerprint and verified proof chain. Evidence bytes are not sent to recruiters; the response uses a sanitized summary and redacted text.
- Existing `POST /invitations` stores recruiter, candidate, role, message, interview type and scheduled time. `GET /invitations` lists invitations for the authenticated recruiter/candidate; `PATCH /invitations/{id}` lets the candidate accept or decline.

## Assessment scores

`POST /assessments/{section}/score` remains the only scoring path. It persists a server-calculated section score; answer indexes remain server-side and never appear in the question response.
# Secure Assessment Mode

All endpoints below require an API JWT. Candidate requests are limited to the authenticated candidate's own assessment sessions; reviewer endpoints return only sessions assigned to the authenticated reviewer.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/secure-assessments/policy` | Candidate, reviewer | Candidate-visible permission/rules policy and enabled targets |
| `GET` | `/api/secure-assessments/targets` | Reviewer | View target scope and activation status |
| `POST` | `/api/secure-assessments/targets` | Reviewer | Add a disabled-by-default target |
| `PATCH` | `/api/secure-assessments/targets/{id}` | Reviewer | Activate/deactivate target and update scope note |
| `PATCH` | `/api/secure-assessments/policy` | Reviewer | Configure resource policy, warning thresholds, retention, fallback, and controls |
| `POST` | `/api/secure-assessments` | Candidate | Create a session after explicit consent and snapshot enabled targets |
| `POST` | `/api/secure-assessments/{id}/start` | Candidate owner | Activate after browser camera/screen permission succeeds |
| `GET` | `/api/secure-assessments` | Candidate, reviewer | List own sessions or sessions assigned to reviewer |
| `PATCH` | `/api/secure-assessments/{id}/status` | Candidate owner | Update browser capability/sharing/fullscreen/connectivity status |
| `POST` | `/api/secure-assessments/{id}/events` | Candidate owner | Record an allowlisted security event |
| `POST` | `/api/secure-assessments/{id}/acknowledge/{event}` | Assigned reviewer | Acknowledge an event |
| `POST` | `/api/secure-assessments/{id}/control` | Assigned reviewer; candidate may end own session | Pause, resume, or end session |
| `GET` | `/api/secure-assessments/{id}/ice-servers` | Session candidate/reviewer | Return STUN and optional short-lived TURN configuration |

Flask-SocketIO events: authenticated `connect` uses `auth.token`; `join_reviewer` joins only the current reviewer's alert room; `join_assessment` checks candidate/reviewer session membership; `rtc_signal` relays only `offer`, `answer`, or `ice` messages for the authorized session and the camera/screen channels. The socket carries signaling and status events, not recorded media.
