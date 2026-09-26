# Resource Index — FREQUENCY (ProofForge Cyber)

Central landing file for reviewers. Fill in or update external hash placeholders before final submission.

## Project

- **Project title:** FREQUENCY (ProofForge Cyber)
- **Team ID:** `HM26-C3B5`
- **Sub-problem:** Verified Cybersecurity Talent & Evidence Pipeline (Hands-on Lab Verification, Technical Defense Audit, Proof-Based Recruitment)

## Links

- **Live demo URL:** <https://proofforge-cyber.onrender.com/>
- **GitHub repository URL:** <https://github.com/yogesh-37911/HM26-C3B5-Phase2.git>

- **Demo video URL:** _Add before final submission._
- **Demo video SHA-256:** _Add after uploading the final video._

- **Coding walkthrough video URL:** _Add before final submission._
- **Coding walkthrough SHA-256:** _Add after uploading the final video._

- **Decision log PDF:** [HM26-C3B5_decision-log.pdf](output/pdf/HM26-C3B5_decision-log.pdf)
- **Decision log Markdown:** [docs/decision-log.md](docs/decision-log.md)
- **Decision log SHA-256:** `2956B4FA939583984C767E71A787B0E84172ADD839C87A79FDB9B35B329E6F68` (Generated PDF: `6944744CF7D6551F489DCB3BA248D59CC79DF6072AF23479561539960727E396`)

- **Presentation PDF:** <https://drive.google.com/file/d/1M13pVLY9oMEygzCYxbzNvGmrcbHV-cc8/view?usp=drive_link>
- **Presentation PDF SHA-256:** `2BF808A4551C94C2`

## Documentation

| Document | Path |
| --- | --- |
| Problem understanding, solution overview, decision log summary | [README.md](README.md) |
| Engineering Decision Log (Full 1-Page Trade-Off Analysis) | [docs/decision-log.md](docs/decision-log.md) |
| AI usage disclosure | [ai.md](ai.md) |
| System architecture, diagrams, schema | [docs/architecture.md](docs/architecture.md) |
| Anti-gaming & security controls | [docs/anti-gaming.md](docs/anti-gaming.md) |
| Known limitations & roadmap | [docs/limitations.md](docs/limitations.md) |
| Setup & run instructions | [docs/setup.md](docs/setup.md) |

## Demo Credentials

All demo accounts share the password `CandidatePass123!` (or configurable via the `DEMO_PASSWORD` environment variable before running `python seed_demo.py`).

| Role | Name | Email | Default Focus |
| --- | --- | --- | --- |
| Candidate | Ananya Rao | `ananya.demo@example.invalid` | Clean Slate (0 Score, 0 Findings, Fresh Assessment) |
| Reviewer | Samira Khan | `samira.demo@example.invalid` | Security Auditor (Rubric Scoring, Defense Q&A, Certification) |
| Recruiter | Jordan Davis | `jordan.demo@example.invalid` | Talent Discovery (DNA Filtering, Sanitized Proof, Multi-Mode Invites) |

## AI Disclosure

See [ai.md](ai.md) for the full, itemised disclosure.

Summary: AI (Claude / Gemini) was used as a development assistant for frontend component scaffolding, TypeScript type definitions, initial assessment question pools, and documentation. **All runtime verification, rubric scoring, Security DNA calculations, and hiring decisions are 100% deterministic with human reviewer authority.** No non-deterministic AI or LLM is in the active decision loop during request handling.

## Verification

SHA-256 hashes of final external deliverables (update video hash values after upload):

```text
presentation.pdf:      2BF808A4551C94C2
decision-log.pdf:      2956B4FA939583984C767E71A787B0E84172ADD839C87A79FDB9B35B329E6F68
demo-video.mp4:        [Add SHA-256 hash after recording]
walkthrough-video.mp4: [Add SHA-256 hash after recording]
```
