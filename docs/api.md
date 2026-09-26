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
