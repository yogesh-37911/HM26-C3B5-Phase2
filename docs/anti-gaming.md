# Anti-gaming controls

| Risk | MVP response |
|---|---|
| Fake findings | Candidate submissions remain pending until reviewer verification. The reviewer can request changes or reject. |
| False-positive spam | Finding accuracy is a visible concept; reviewer decisions remain authoritative. The UI demo values are synthetic. |
| Copied evidence | Backend SHA-256 evidence hashes flag exact duplicate evidence from one candidate; a reviewer must judge context. |
| Fake tool knowledge | Tool selection is a claim. Practical, reviewed lab work is the verification signal. |
| MCQ cheating | Correct indexes are server-side; candidate question responses omit answers and scoring is computed by the API. |
| Ranking manipulation | Candidate cannot submit a score or verification field. Final reviewer score is server-controlled. |
| API abuse | Flask-Limiter rate limits authentication and submission endpoints; production deployments should add a WAF and shared rate-limit storage. |
| Answer-key extraction | The answer key is not returned by the assessment read endpoint. Avoid exposing debug traces or database access in deployment. |
| Report/evidence inconsistencies | Reviewer sees evidence, reproduction and report fields together; consistency judgment is human-led. |
| Defense answer inconsistency | Reviewer-authored questions and separately scored answers are attached to the finding; the score is retained separately from verification. |
| Weak or incomplete proof | Skill confidence includes whether report and reproduction fields exist; reviewers can record report quality and evidence consistency rubric scores. |
| Suspicious volume | A simple submission threshold logs a suspicion event and limits further submissions; it does not automatically ban anyone. |

These controls are lightweight signals, not perfect fraud detection. Similar evidence can be legitimate, hashes do not prove authorship, and human review can be mistaken. Production use needs abuse monitoring, reviewer calibration and appeal paths.
