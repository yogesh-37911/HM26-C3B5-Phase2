# Engineering Decision Log — FREQUENCY (Verifiable Proof-of-Work Engineering Discovery & Hiring Platform)

**Team ID:** `HM26-C3B5` | **Track:** Cybersecurity Talent & Evidence Pipeline | **Scope:** Phase 2 Submission

---

### Q1. What approach did we take, and what did we reject? 

We built an audited, deterministic evidence pipeline coupled with human reviewer authority and decoupled confidence scoring.  
**Chosen Approach (Inputs → Logic → Output):**  
Candidate raw HTTP lab payloads, drag-and-drop vulnerability reports, and timed 40-question answers $\rightarrow$ SHA-256 evidence collision hashing + 7-dimensional reviewer rubric scoring + server-side non-linear 9-domain DNA weighting $\rightarrow$ Ungameable candidate Security DNA, sanitized recruiter reproduction cards, and synchronized interview invitations.

**Rejected Alternative:**  
We seriously considered and prototyped an automated LLM-based vulnerability grading engine that would ingest candidate exploit submissions and generate instant capability scores via prompt engineering. This appeared highly attractive at first because it promised zero-touch scalability, instant feedback for candidates within seconds, and eliminated human reviewer scheduling bottlenecks during high-volume hackathon evaluations.

---

### Q2. Why did we reject it? What was the trade-off? 

We rejected automated LLM evaluation across four critical engineering dimensions:
1. **Adversarial & Prompt Injection Vulnerability:** Penetration testing payloads inherently contain hostile syntax (SQL quotes, script tags, serialized blobs). An LLM evaluator is fundamentally vulnerable to prompt injection inside proof payloads that manipulate the model into granting perfect scores.
2. **Hallucination & Legal Defensibility:** LLMs frequently hallucinate CVSS severities or accept superficial curl commands as verified exploits. In professional hiring, an unverifiable score exposes recruiters to bad hires and candidates to unfair rejections.
3. **Build Determinism in 72 Hours:** Fine-tuning and stabilizing prompt variance under hackathon time constraints was non-deterministic; our relational rubric and Python mathematical scoring engine delivered 100% reproducible, unit-testable scores.
4. **Recruiter Trust:** Hiring managers explicitly stated they do not trust "AI-evaluated security talent." They demand human-verified reproduction steps.

**The Trade-off We Accepted:**  
We knowingly accepted an **asynchronous review queue delay**. Candidates cannot receive instantaneous verified status upon submission; they must wait for human auditor review and defense evaluation. We decided this friction was a necessary cost to maintain absolute integrity.

---

### Q3. What breaks at scale? 

When scaled across all engineering colleges and organizations across Mysuru and regional hubs—simulating 50,000 active candidates and 1,000 reviewers during synchronized campus placement drives—the first failure point is **database write contention and table scans during synchronized assessment submissions**.

Specifically, 50,000 candidates concurrently submitting 40-question assessments within a 20-minute deadline generates 2,000,000 row writes to `assessment_results` and triggers unindexed SHA-256 hash collision checks across millions of historical findings. Under default PostgreSQL pooling (100–200 connections), this causes transaction serialization deadlocks, connection pool starvation, and request timeouts exceeding 30 seconds.

**Immediate Architectural Fix:**
1. Decouple submission ingestion from synchronous scoring using an asynchronous message queue (Redis Streams / Celery workers) with batch insertion ($5,000$ items/batch).
2. Implement an in-memory Redis Bloom Filter ($<15\text{ MB}$ RAM for 10 million hashes at $0.1\%$ false-positive rate) to achieve $O(1)$ duplicate evidence collision pre-filtering before relational database writes.
3. Partition the `submissions` and `assessment_results` tables by `(candidate_id, section_id)` with B-tree indices on evidence hashes.
