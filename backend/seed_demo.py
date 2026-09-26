"""Create demo login accounts without preloading candidate outcome data."""

import os

from werkzeug.security import generate_password_hash
from app import app, db, User

default_demo_pw = os.getenv("DEMO_PASSWORD") or "DemoPassword123!"

passwords = {
    "candidate": os.getenv("DEMO_CANDIDATE_PASSWORD") or default_demo_pw,
    "reviewer": os.getenv("DEMO_REVIEWER_PASSWORD") or default_demo_pw,
    "recruiter": os.getenv("DEMO_RECRUITER_PASSWORD") or default_demo_pw,
}
if any(not password or len(password) < 12 for password in passwords.values()):
    raise SystemExit(
        "Set DEMO_CANDIDATE_PASSWORD / DEMO_REVIEWER_PASSWORD / "
        "DEMO_RECRUITER_PASSWORD (12+ characters), or set a private DEMO_PASSWORD."
    )

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
            # Refresh seeded demo credentials from private environment values.
            user.password = generate_password_hash(passwords[role], method="scrypt")

    db.session.commit()
    print(
        "Demo accounts are ready. Candidate results start empty and are created "
        "through the candidate and reviewer workflow."
    )
