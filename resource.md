# Resource & Decision Log

## Project decisions

- **Modular monolith:** Flask keeps authentication, submissions, reviewer operations and recruiter invitations in one auditable application. Microservices would add deployment overhead without improving this MVP.
- **PostgreSQL with local SQLite fallback:** production-shaped relational models are ready for PostgreSQL; the default local path keeps the demo simple.
- **Evidence before scores:** submitted proof is hashed and duplicate evidence is flagged. Reviewer verification remains a separate, explicit action.
- **Human final authority:** the reviewer records the final score and status. The demo AI panel is clearly advisory and deterministic, not a runtime AI claim.
- **Controlled targets:** examples use placeholders and the lab UI describes an isolated synthetic target. There is no arbitrary-host scanner or arbitrary network execution feature.
- **Synthetic recruiter profiles:** discovery demonstrates the experience without implying that demo records are real people or genuine security outcomes.
- **Simplified persistence in the UI:** the polished demo UI runs without a backend connection. The Flask API separately implements the security-sensitive flows; wire them together before using real records.

## External references

Tool syntax and security concepts are educational examples, not a live vulnerability feed. Current advisories should be sourced from official vendor advisories, CISA KEV, NVD and OWASP at the time of use; this demo does not claim to provide current threat intelligence.
