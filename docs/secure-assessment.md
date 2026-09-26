# Secure Assessment Mode

Secure Assessment Mode extends the existing candidate assessment and reviewer workspace. Candidate and reviewer identity continues to use the Flask JWT authentication already in the app. A session is assigned to the reviewer configured by `SECURE_ASSESSMENT_REVIEWER_EMAIL` (defaults to the seeded Samira reviewer).

## Candidate flow and browser permissions

1. Candidate reviews the consent, monitoring, external-resource rules, and session target list.
2. Candidate explicitly checks the consent box, then chooses **Start Secure Assessment**.
3. The browser's native `getUserMedia()` permission prompt requests camera access; the camera preview remains visible to the candidate. Microphone permission is optional by default, and a reviewer can make it required.
4. The browser's native `getDisplayMedia()` picker lets the candidate choose a display, window, or tab. The app does not select or grant it on the candidate's behalf.
5. Candidate chooses **Enter fullscreen**. The assessment cannot be opened until camera, screen share, fullscreen, and active session state are confirmed.
6. The candidate can end the secure session at any time. Ending the session stops local tracks and informs the API/reviewer.

These browser APIs require a secure context (HTTPS in deployment; localhost is allowed for development) and explicit browser user action. They cannot silently grant permissions. A browser can deny or revoke access. The app detects fullscreen exits, hidden tabs, focus loss, network changes, ended camera/microphone tracks, screen-share termination, and reviewer pause/end actions. These signals are an audit aid, not proof of misconduct. Focus and visibility events can occur during legitimate target navigation.

## Reviewer access and real-time media

Reviewers use **Secure Assessments** in their existing workspace. API queries are restricted to sessions whose `reviewer_id` matches the logged-in reviewer. WebSocket signaling authenticates the existing JWT and checks session assignment before joining rooms or relaying SDP/ICE messages. Camera and screen media travel directly between candidate and reviewer over WebRTC using DTLS-SRTP; the Flask service relays signaling/status only. The app does not record or persist audio/video. Reviewers see separate camera and screen panels, session status, timer, events, acknowledgement controls, and pause/resume/end actions.

Configure TLS for both frontend and API. Render's API runs Flask-SocketIO under one Gunicorn `gthread` worker with 100 threads; do not scale this Socket.IO process to multiple workers without adding a shared message queue and validating sticky-session behavior. STUN is configured with `STUN_URL`. For restrictive NAT/firewall networks, configure a TURN service using `TURN_URL` and a coturn-compatible time-limited REST `TURN_SHARED_SECRET`. The API derives one-hour per-user credentials and only returns them to the assigned candidate/reviewer. Without TURN, peer-to-peer media may fail on some networks; the UI can show the configured HTTPS fallback meeting link.

Set `SECURE_ASSESSMENT_REVIEWER_EMAIL` to the provisioned reviewer account that should receive candidate sessions. The seeded demo uses `samira.demo@example.invalid`. Provision real reviewer users through a trusted process; do not create open reviewer registration.

## Allowed targets and policies

Reviewers can add target URLs. Newly added targets default to disabled; activation is an explicit reviewer scope decision. Each new assessment snapshots the active targets so later changes do not silently broaden an in-progress session. Candidates see the snapshot and the assessment rules. Do not activate a target until its owner has provided explicit written permission and exact scope.

The seed list enables the intentionally vulnerable Google Gruyere codelab and Acunetix Test ASP.NET training target. Hack Mysuru is seeded **disabled** because a public event/participant site does not itself publish security-testing authorization. Keep it disabled unless its owner provides written authorization and scope. Configure only dedicated lab hosts and non-destructive test boundaries.

Reviewers can configure whether search engines, documentation, GitHub, Stack Overflow, AI tools, and other external sites are permitted; optional microphone policy; session duration; warning threshold; maximum violations; automatic pause/submission; HTTPS fallback link; and event-data retention days. This is policy display and workflow configuration, not network enforcement.

## Event handling and retention

Security events are stored with candidate ID, assessment ID, server timestamp, event name, severity, and bounded JSON metadata. Reviewer event acknowledgements are persisted. Repeated events produce candidate warnings. `auto_pause` pauses on critical events; `auto_submit` submits when the configured maximum violation count is reached. By default, ended sessions and event logs are retained for 30 days. Expired event/session records are purged when the policy/session APIs are accessed. Media content is not retained. Organizations should add a scheduled cleanup job and their records policy before production.

## Browser controls vs managed kiosk

**Browser-level controls** implemented here: native camera/microphone and display capture permission prompts; visible preview and sharing status; fullscreen request and exit detection; visibility/focus/network event logging; warnings; reduced in-app navigation during the assessment; and session end controls. Browsers cannot reliably block OS applications, Task Manager, keyboard shortcuts, other browsers, developer tools, or all navigation. JavaScript does not claim OS-level lockdown.

**Managed kiosk controls** belong to the institution's endpoint layer: managed browser kiosk policy or dedicated assessment client, centrally managed device accounts, operating-system policy, application allowlisting, and device restrictions. Keep that layer separate and documented. For real target confinement, apply network/DNS/proxy policy in addition to browser policy:

```text
Managed Browser / Kiosk Policy
              ↓
Network, DNS, or Proxy Allowlist
              ↓
Explicitly Authorized Assessment Targets
```

Do not rely on client-side blacklists or the displayed external-resource checkboxes to restrict network access. Place the candidate endpoint behind an egress proxy/firewall that permits only the approved assessment hosts and any explicitly authorized identity, signaling, and TURN services.

## Local development

Install frontend and backend dependencies using [setup.md](setup.md), then run the API from `backend` and Vite from the repository root. Use `http://localhost:5173` for local Vite and `http://localhost:5000` for the API. Set `FRONTEND_ORIGIN=http://localhost:5173`, `VITE_API_BASE_URL=http://localhost:5000`, a private `JWT_SECRET_KEY`, and private 12+ character `DEMO_PASSWORD` (or role-specific demo password variables). Seed demo accounts with `python seed_demo.py`. For end-to-end camera/screen permissions, use localhost in a supported browser and grant each permission explicitly.

## Production deployment checklist

- Use HTTPS for frontend/API and WSS for Socket.IO; set exact `FRONTEND_ORIGIN` and frontend `VITE_API_BASE_URL`.
- Keep JWT and TURN shared secrets only in backend secret storage. TURN credentials are minted server-side and expire.
- Configure a real TURN service when the candidate/reviewer networks require it; allow its UDP/TCP/TLS ports at the network layer.
- Keep Socket.IO on one worker unless a shared Socket.IO message queue and deployment behavior are configured.
- Assign sessions to the correct reviewer and provision reviewer accounts through an administrator.
- Review each target's written authorization/scope before enabling it; configure network allowlisting outside this application.
- Decide retention and access policies with the organization. No camera or screen recording is stored by this feature.
- Test browser permission UX and WebRTC connectivity on the actual managed devices and networks before use with candidates.
- This app is not a managed kiosk client. Use organization-managed endpoint policy if preventing OS-level app switching is required.
