# Resource Index — FREQUENCY (ProofForge Cyber)

Central landing file for reviewers. Fill in or update external hash placeholders before final submission.

## Project

- **Project title:** FREQUENCY (ProofForge Cyber)
- **Team ID:** `HM26-C3B5`
- **Sub-problem:** Verified Cybersecurity Talent & Evidence Pipeline (Hands-on Lab Verification, Technical Defense Audit, Proof-Based Recruitment)

## Links

- **Live demo URL:** <https://proofforge-cyber.onrender.com>
- **GitHub repository URL:** <https://github.com/yogesh-37911/HM26-C3B5-Phase2.git>

- **Decision log PDF:** [HM26-C3B5_decision-log.pdf](output/pdf/HM26-C3B5_decision-log.pdf)
- **Decision log Markdown:** [docs/decision-log.md](docs/decision-log.md)
- **Presentation PDF:** [HM26-C3B5_presentation.pdf](output/pdf/HM26-C3B5_presentation.pdf)

SHA-256 checksums for the committed PDFs:

```text
presentation.pdf: 9F6287A3BA64A1B0D041926D382AA419640AC5D554E22DE28844D61E54910E69
decision-log.pdf: D463E7BBDBE1B6DAD7072F9855A75A3B6276C624AC07D456DE598412B549C052
```

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

SHA-256 hashes of the current deliverables:

```text
presentation.pdf: 9F6287A3BA64A1B0D041926D382AA419640AC5D554E22DE28844D61E54910E69
decision-log.pdf: D463E7BBDBE1B6DAD7072F9855A75A3B6276C624AC07D456DE598412B549C052
```
