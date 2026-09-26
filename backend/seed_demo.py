"""Create explicitly synthetic API demo accounts and reviewed finding records."""

import hashlib
import os

from werkzeug.security import generate_password_hash
from app import app, db, User, Submission, AssessmentResult

default_demo_pw = os.getenv("DEMO_PASSWORD") or "DemoPassword123!"

passwords = {
    "candidate": os.getenv("DEMO_CANDIDATE_PASSWORD") or default_demo_pw,
    "reviewer": os.getenv("DEMO_REVIEWER_PASSWORD") or default_demo_pw,
    "recruiter": os.getenv("DEMO_RECRUITER_PASSWORD") or default_demo_pw,
}
if any(not password or len(password) < 12 for password in passwords.values()):
    raise SystemExit("Set DEMO_CANDIDATE_PASSWORD / DEMO_REVIEWER_PASSWORD / DEMO_RECRUITER_PASSWORD (12+ characters), or set a private DEMO_PASSWORD.")

people = [
    ("Ananya Rao", "ananya.demo@example.invalid", "candidate"),
    ("Rohan Mehta", "rohan.demo@example.invalid", "candidate"),
    ("Maya Iyer", "maya.demo@example.invalid", "candidate"),
    ("Samira Khan", "samira.demo@example.invalid", "reviewer"),
    ("Dev Patel", "dev.demo@example.invalid", "reviewer"),
    ("Jordan Davis", "jordan.demo@example.invalid", "recruiter"),
    ("Taylor Reed", "taylor.demo@example.invalid", "recruiter"),
]

with app.app_context():
    users = {}

    for name, email, role in people:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password=generate_password_hash(passwords[role], method="scrypt"),
                role=role,
            )
            db.session.add(user)
        else:
            # Refresh seeded demo credentials from their private environment
            # values whenever the demo service starts.
            user.password = generate_password_hash(passwords[role], method="scrypt")
        users[email] = user

    db.session.flush()

    if Submission.query.count() == 0:
        samples = [
            ("Broken Access Control", "API Authorization Lab", "High", "verified"),
            ("Session Fixation", "Broken Authentication Lab", "Medium", "verified"),
            ("Reflected XSS", "Reflected XSS Lab", "Medium", "pending"),
            ("SQL Injection", "SQL Injection Lab", "High", "verified"),
            ("Excessive Data Exposure", "API Authorization Lab", "Low", "pending"),
            ("Insecure Direct Object Reference", "Access Control Lab", "High", "verified"),
            ("Service Discovery", "Network Enumeration Lab", "Informational", "verified"),
            ("Weak Session Expiry", "Broken Authentication Lab", "Medium", "verified"),
            ("Missing Rate Limit", "API Authorization Lab", "Low", "pending"),
            ("Unsafe Redirect", "Web Security Lab", "Medium", "verified"),
            ("Verbose Error Handling", "Web Security Lab", "Low", "pending"),
        ]

        candidates = [
            users["ananya.demo@example.invalid"],
            users["rohan.demo@example.invalid"],
            users["maya.demo@example.invalid"],
        ]

        for i, (title, lab, severity, status) in enumerate(samples):
            evidence = (
                f"Synthetic sanitized request/response evidence "
                f"for demo finding {i + 1}."
            )
            db.session.add(
                Submission(
                    candidate_id=candidates[i % 3].id,
                    lab=lab,
                    vulnerability=title,
                    category="Web Security",
                    component="Synthetic training endpoint",
                    severity=severity,
                    description=(
                        f"Demo record: {title} was observed inside "
                        f"an authorized training lab."
                    ),
                    evidence=evidence,
                    evidence_hash=hashlib.sha256(
                        evidence.encode()
                    ).hexdigest(),
                    reproduction=(
                        "1. Open the assigned synthetic lab. "
                        "2. Follow the lab prompt. "
                        "3. Observe the documented behavior."
                    ),
                    impact=(
                        "Potentially affects data or behavior within "
                        "the isolated synthetic training target only."
                    ),
                    recommendation=(
                        "Apply and retest the relevant server-side "
                        "validation or authorization control."
                    ),
                    status=status,
                    score=87 if status == "verified" else None,
                )
            )

    # Synthetic historical assessment results give each candidate a separate
    # starting profile. Never overwrite results once a candidate has a score.
    sample_scores = {
        "ananya.demo@example.invalid": {
            "Aptitude": 80,
            "English & Security Communication": 90,
            "Cybersecurity Fundamentals": 70,
            "Ethical Hacking & Pentesting": 80,
        },
        "rohan.demo@example.invalid": {
            "Aptitude": 60,
            "English & Security Communication": 70,
            "Cybersecurity Fundamentals": 75,
            "Ethical Hacking & Pentesting": 65,
        },
        "maya.demo@example.invalid": {
            "Aptitude": 90,
            "English & Security Communication": 85,
            "Cybersecurity Fundamentals": 88,
            "Ethical Hacking & Pentesting": 92,
        },
    }
    for email, sections in sample_scores.items():
        candidate = users[email]
        for section, percent in sections.items():
            result = AssessmentResult.query.filter_by(candidate_id=candidate.id, section=section).first()
            if result is None:
                db.session.add(AssessmentResult(candidate_id=candidate.id, section=section, percent=percent))

    db.session.commit()
    print(
        "Synthetic demo accounts and findings are ready. "
        "Demo accounts are ready; use the private password configured for the account's role."
    )
