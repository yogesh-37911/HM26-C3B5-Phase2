# Security notes

- Practical work is authorized-lab-only. Never test an arbitrary external target.
- Use HTTPS, a private random `JWT_SECRET_KEY`, managed secrets and a restricted PostgreSQL account in deployment. Never deploy `.env.example` values.
- Change the CORS origin to the exact trusted frontend origin.
- Configure shared rate-limit storage (such as Redis) for multi-worker deployments; memory limits reset on process restart.
- Enforce per-user authorization for every record and test access control before production. Reviewer and recruiter APIs are role protected.
- Evidence is limited to 2 MB request size and stored as text in the MVP. Production needs malware scanning, file-type allowlists, encrypted storage, retention policies and secret redaction.
- The API does not execute candidate commands, fetch target URLs, or provision labs. Add isolated ephemeral sandboxes with egress blocked before offering real lab execution.
- Public registration is candidate-only; reviewer and recruiter roles must be provisioned through a trusted administrative process.
- Sign-in authenticates against the API. Passwords use scrypt hashes, login is rate-limited, and role privileges come from the database account, not the workspace picker.
- Access tokens expire after four hours and are stored in browser session storage. Sign-out revokes the active token. Session storage remains accessible to same-origin scripts; use Secure, HttpOnly cookies before handling sensitive production data.
- Demo passwords are generated as private Render environment values. Do not commit, publish, or reuse them.
- The workspace still contains synthetic client-side data; authentication does not make its local actions persistent or make demo evidence authoritative.
- External training links open in a separate tab and are not isolated by ProofForge. For Google Gruyere, follow only its published codelab instructions. Acunetix's Test ASP.NET is listed as a scanner demo target; keep testing limited to that host and low impact.
- The HackMysuru participant site is listed as a view-only reference. No security testing scope is published there; do not test it without explicit written authorization and scope from its operator.
- Keep dependency versions reviewed and patched; add TLS termination, security headers, database backups, audit retention and operational alerting before deployment.

The candidate assessment is a standard timed questionnaire. The application does not request camera, microphone, fullscreen, or display-capture permissions; the hosted frontend disables those browser capabilities with its Permissions-Policy header.
