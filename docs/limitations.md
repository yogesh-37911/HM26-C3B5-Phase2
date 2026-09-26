# Limitations and roadmap

## Known limitations

1. Lab targets are described as isolated training environments, but this MVP does not provision vulnerable Docker containers. Do not aim it at real systems.
2. The front-end demo uses synthetic local state and is not connected to the Flask API or authenticated sessions.
3. The API stores evidence text only. Recruiter proof views redact several common credential and email patterns, but this is not a replacement for a reviewed redaction pipeline or secure file upload.
4. Reviewer AI content is a deterministic illustrative advisory, not a runtime model or automated validation.
5. Recruiter profiles and capability scores in the front end are synthetic, not computed from live verified records.
6. The API uses a simple submission threshold and in-memory default rate limiting; these are not production abuse defenses.
7. Security knowledge content is a lightweight reference, not a course or continuously maintained advisory feed.
8. Assessment keys and scoring are server-side and section scores persist, but per-question attempt history, randomized question order and timing controls are not implemented.
9. The UI invitation accepts or declines are demonstration interactions; API invitation responses are ownership protected.

## Roadmap

1. Connect frontend authentication and role pages to API sessions and persisted records.
2. Provision isolated, resettable per-candidate Docker labs with network egress denied and resource quotas.
3. Add per-question assessment attempt history and rubric-change history; section results, defense answers and reviewer rubric scores already persist.
4. Add sanitized evidence uploads, scanning, retention policy and report PDF generation.
5. Build capability scoring from verified records, publish transparent score provenance and reviewer appeals.
6. Add shared rate-limit storage, operational monitoring and security review before any production deployment.
