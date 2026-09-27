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
presentation.pdf: 831586769FF2968397CE93E8DF0C05F316092CEA69D1BB20837E60A3FEEACBCE
decision-log.pdf: DBF959FE21F88A394792F21BC28110CE9B95B703BB6F861007338E54DD945B79
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
presentation.pdf: 831586769FF2968397CE93E8DF0C05F316092CEA69D1BB20837E60A3FEEACBCE
decision-log.pdf: DBF959FE21F88A394792F21BC28110CE9B95B703BB6F861007338E54DD945B79
```
