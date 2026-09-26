"""ProofForge Cyber API. Synthetic demo defaults; PostgreSQL via DATABASE_URL."""

import hashlib
import json
import os
import re
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

db = SQLAlchemy()
app = Flask(__name__)
secret_key = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))

database_url = os.getenv("DATABASE_URL", "sqlite:///proofforge.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

app.config.update(
    SQLALCHEMY_DATABASE_URI=database_url,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS={
        "pool_pre_ping": True,
        "pool_recycle": 300,
    },
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY", secret_key),
    JWT_SECRET_KEY=secret_key,
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=4),
    MAX_CONTENT_LENGTH=25 * 1024 * 1024,
)

db.init_app(app)
jwt = JWTManager(app)
frontend_origins = [o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if o.strip()]

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*" if "*" in frontend_origins else frontend_origins
        }
    },
)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["120 per minute"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
)

# Email validation pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)


class TokenBlocklist(db.Model):
    """Revoked access tokens, so sign-out invalidates the current JWT."""
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    revoked_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)


class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False
    )
    lab = db.Column(db.String(120), nullable=False)
    vulnerability = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    component = db.Column(db.String(200), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=False)
    evidence = db.Column(db.Text, nullable=False)
    evidence_hash = db.Column(db.String(64), nullable=False)
    reproduction = db.Column(db.Text, nullable=False)
    impact = db.Column(db.Text, nullable=False)
    recommendation = db.Column(db.Text, nullable=False)
    references = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="pending")
    score = db.Column(db.Integer)
    created = db.Column(db.DateTime, server_default=db.func.now())


class CandidateDocument(db.Model):
    """Uploaded penetration test and audit documents (PDF / Word) with reviewer evaluations."""
    __tablename__ = "candidate_document"
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    candidate_name = db.Column(db.String(120), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    lab = db.Column(db.String(120), default="General Security Assessment")
    severity = db.Column(db.String(20), default="High")
    doc_type = db.Column(db.String(20), nullable=False)  # "pdf", "docx", "doc"
    file_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, default=0)
    file_data = db.Column(db.Text, nullable=False)  # Base64 data URL
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(30), default="pending")  # "pending", "verified", "needs_changes", "rejected"
    reviewer_score = db.Column(db.Integer, nullable=True)
    reviewer_feedback = db.Column(db.Text, default="")
    reviewed_by = db.Column(db.String(120), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)


class DefenseQuestion(db.Model):
    """Reviewer-authored defense prompt and candidate response for a finding."""
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("submission.id"), nullable=False, index=True)
    submission = db.relationship("Submission")
    reviewer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text)
    reviewer_score = db.Column(db.Integer)
    reviewer_note = db.Column(db.String(1000), default="")
    created = db.Column(db.DateTime, server_default=db.func.now())


class AssessmentResult(db.Model):
    """Persist only server-calculated section scores, never answer keys."""
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    section = db.Column(db.String(100), nullable=False)
    percent = db.Column(db.Integer, nullable=False)
    created = db.Column(db.DateTime, server_default=db.func.now())
    __table_args__ = (db.UniqueConstraint("candidate_id", "section", name="uq_assessment_candidate_section"),)


class ReviewerMetrics(db.Model):
    """Optional rubric dimensions, kept separate from the final reviewer score."""
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("submission.id"), nullable=False, unique=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    report_quality = db.Column(db.Integer, nullable=False, default=0)
    evidence_consistency = db.Column(db.Integer, nullable=False, default=0)
    created = db.Column(db.DateTime, server_default=db.func.now())


class Invitation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False
    )
    candidate_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False
    )
    role = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    interview_type = db.Column(db.String(30), nullable=False)
    scheduled_at = db.Column(db.String(40), nullable=False)
    status = db.Column(db.String(20), default="pending")


class Audit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer)
    event = db.Column(db.String(120), nullable=False)
    detail = db.Column(db.String(250), default="")
    created = db.Column(db.DateTime, server_default=db.func.now())


class RecruiterCandidateApproval(db.Model):
    """A reviewer explicitly passed this candidate into the recruiter roster."""
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True, index=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    approved_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class SecureAssessment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    candidate_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String(160), nullable=False, default="Secure Cybersecurity Assessment")
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    duration_minutes = db.Column(db.Integer, nullable=False, default=20)
    consent_at = db.Column(db.DateTime)
    started_at = db.Column(db.DateTime)
    ended_at = db.Column(db.DateTime)
    camera = db.Column(db.Boolean, nullable=False, default=False)
    microphone = db.Column(db.Boolean, nullable=False, default=False)
    screen = db.Column(db.Boolean, nullable=False, default=False)
    fullscreen = db.Column(db.Boolean, nullable=False, default=False)
    connected = db.Column(db.Boolean, nullable=False, default=False)
    current_challenge = db.Column(db.String(160), default="")
    warning_count = db.Column(db.Integer, nullable=False, default=0)
    allowed_targets = db.Column(db.Text, nullable=False, default="[]")
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)


class SecureAssessmentEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.String(36), db.ForeignKey("secure_assessment.id"), nullable=False, index=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    event_type = db.Column(db.String(48), nullable=False)
    severity = db.Column(db.String(16), nullable=False, default="info")
    metadata_json = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    acknowledged_at = db.Column(db.DateTime)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey("user.id"))


class AllowedAssessmentTarget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    url = db.Column(db.String(500), nullable=False, unique=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
    authorization_note = db.Column(db.String(300), nullable=False, default="Use only within the published lab scope.")


class SecureAssessmentPolicy(db.Model):
    id = db.Column(db.Integer, primary_key=True, default=1)
    duration_minutes = db.Column(db.Integer, nullable=False, default=20)
    microphone_optional = db.Column(db.Boolean, nullable=False, default=True)
    warning_threshold = db.Column(db.Integer, nullable=False, default=1)
    max_violations = db.Column(db.Integer, nullable=False, default=5)
    retention_days = db.Column(db.Integer, nullable=False, default=30)
    auto_pause = db.Column(db.Boolean, nullable=False, default=False)
    auto_submit = db.Column(db.Boolean, nullable=False, default=False)
    fallback_meeting_url = db.Column(db.String(500), default="")
    allow_search_engines = db.Column(db.Boolean, nullable=False, default=True)
    allow_documentation = db.Column(db.Boolean, nullable=False, default=True)
    allow_github = db.Column(db.Boolean, nullable=False, default=True)
    allow_stackoverflow = db.Column(db.Boolean, nullable=False, default=True)
    allow_ai_tools = db.Column(db.Boolean, nullable=False, default=True)
    allow_external_websites = db.Column(db.Boolean, nullable=False, default=True)


# ---------------------------------------------------------------------------
# Assessment Data
# ---------------------------------------------------------------------------

ASSESSMENTS = {
    "Aptitude": [
        (
            "A sequence increases by 3 each time: 2, 5, 8, … what comes next?",
            ["10", "11", "12", "13"],
            2,
        ),
        (
            "If all lab targets are isolated and host A is a lab target, what follows?",
            [
                "A is isolated",
                "A is public",
                "A is vulnerable",
                "Nothing can be inferred",
            ],
            0,
        ),
        (
            "A tester reviews 4 endpoints in 20 minutes. At the same pace, how many in an hour?",
            ["8", "10", "12", "16"],
            2,
        ),
        (
            "Which is the odd one out?",
            ["16", "25", "36", "42"],
            3,
        ),
        (
            "A finding has 3 evidence items. Two are duplicated. How many unique remain?",
            ["1", "2", "3", "5"],
            1,
        ),
        (
            "If a test takes 15 min, how long do 4 independent tests take sequentially?",
            ["45", "60", "75", "90"],
            1,
        ),
        (
            "Which value completes: 1, 2, 4, 8, …?",
            ["10", "12", "14", "16"],
            3,
        ),
        (
            "A reviewer verifies 9 of 12 findings. What fraction is verified?",
            ["1/4", "1/2", "3/4", "4/5"],
            2,
        ),
        (
            "Which is the smallest number?",
            ["0.8", "3/4", "0.78", "7/10"],
            3,
        ),
        (
            "Two reviewers each assess 5 reports. How many assessments total?",
            ["5", "8", "10", "25"],
            2,
        ),
    ],
    "English & Security Communication": [
        (
            "Choose the clearest finding title.",
            [
                "Bad website",
                "User ID can access another user\u2019s profile",
                "The app has issues",
                "Critical bug!!!",
            ],
            1,
        ),
        (
            "A useful reproduction step should be\u2026",
            ["Vague", "Repeatable and specific", "Only verbal", "A guess"],
            1,
        ),
        (
            "Choose the grammatically correct sentence.",
            [
                "The request were blocked.",
                "The request was blocked.",
                "The request be blocked.",
                "The request blocking.",
            ],
            1,
        ),
        (
            "A concise executive summary should explain\u2026",
            [
                "Impact and key outcome",
                "Every raw log line",
                "Only tool names",
                "The reviewer\u2019s biography",
            ],
            0,
        ),
        (
            "Which is objective evidence?",
            [
                "I feel it is risky",
                "A sanitized response showing another account\u2019s record",
                "Everyone knows this",
                "It seems broken",
            ],
            1,
        ),
        (
            "A remediation recommendation should be\u2026",
            [
                "Actionable and scoped",
                "A list of unrelated tools",
                "Only a severity label",
                "Omitted",
            ],
            0,
        ),
        (
            "Select the professional phrasing.",
            [
                "This is obviously terrible",
                "The endpoint returned data outside the authorized account",
                "The devs messed up",
                "lol it leaks",
            ],
            1,
        ),
        (
            "A retest recommendation describes\u2026",
            [
                "How to verify the fix safely",
                "How to broaden the attack",
                "A hiring decision",
                "An unrelated test",
            ],
            0,
        ),
        (
            "Good report references should be\u2026",
            ["Relevant and traceable", "Invented", "Hidden", "Unrelated"],
            0,
        ),
        (
            "When uncertain about severity, a report should\u2026",
            [
                "Explain assumptions and impact",
                "Overstate it",
                "Remove evidence",
                "Use all caps",
            ],
            0,
        ),
    ],
    "Cybersecurity Fundamentals": [
        (
            "What does confidentiality protect?",
            [
                "Data from unauthorized disclosure",
                "System uptime",
                "Data correctness only",
                "Network speed",
            ],
            0,
        ),
        (
            "HTTP status 401 most commonly means\u2026",
            [
                "Unauthorized / authentication required",
                "Not found",
                "Success",
                "Server error",
            ],
            0,
        ),
        (
            "Authentication answers\u2026",
            [
                "Who are you?",
                "What may you access?",
                "Where is the server?",
                "What is the severity?",
            ],
            0,
        ),
        (
            "Authorization checks\u2026",
            [
                "What an identity may do",
                "Password strength only",
                "DNS records",
                "Encryption speed",
            ],
            0,
        ),
        (
            "DNS primarily maps\u2026",
            [
                "Names to network addresses",
                "Users to passwords",
                "Ports to files",
                "Hashes to keys",
            ],
            0,
        ),
        (
            "A secure password should generally be\u2026",
            [
                "Unique and long",
                "Shared with a team",
                "Reused everywhere",
                "Written into source",
            ],
            0,
        ),
        (
            "HTTPS provides transport protection using\u2026",
            ["TLS", "FTP", "Telnet", "ARP"],
            0,
        ),
        (
            "Least privilege means\u2026",
            [
                "Grant only necessary access",
                "Grant admin to everyone",
                "Disable audit logs",
                "Use one shared account",
            ],
            0,
        ),
        (
            "Which is a server-side authorization control?",
            [
                "Checking ownership on each API request",
                "Hiding a button in CSS",
                "Changing the URL",
                "Client-side validation alone",
            ],
            0,
        ),
        (
            "A CVE identifier refers to\u2026",
            [
                "A publicly cataloged vulnerability record",
                "A password standard",
                "A network port",
                "A severity score only",
            ],
            0,
        ),
    ],
    "Ethical Hacking & Pentesting": [
        (
            "Before testing a target, first confirm\u2026",
            [
                "Explicit authorization and scope",
                "The target looks interesting",
                "A scanner is installed",
                "The finding severity",
            ],
            0,
        ),
        (
            "Nmap -sV is commonly used to\u2026",
            [
                "Detect service versions",
                "Crack passwords",
                "Edit firewall rules",
                "Generate a report",
            ],
            0,
        ),
        (
            "Burp Suite proxy helps inspect\u2026",
            [
                "Web request and response traffic",
                "Disk sectors",
                "Wireless spectrum only",
                "Source control history",
            ],
            0,
        ),
        (
            "A safe test target is\u2026",
            [
                "An assigned isolated lab",
                "An arbitrary public IP",
                "A coworker\u2019s account",
                "A production system without permission",
            ],
            0,
        ),
        (
            "A strong finding should include\u2026",
            [
                "Evidence, reproduction, impact and remediation",
                "Only a vulnerability name",
                "A screenshot with secrets",
                "An unverified claim",
            ],
            0,
        ),
        (
            "After identifying a suspected issue, you should\u2026",
            [
                "Validate safely within scope",
                "Escalate beyond scope",
                "Exfiltrate data",
                "Hide the activity",
            ],
            0,
        ),
        (
            "Object-level API access must be checked\u2026",
            [
                "On the server for each requested object",
                "Only in the UI",
                "Only at login",
                "By trusting the ID parameter",
            ],
            0,
        ),
        (
            "How should lab evidence be shared?",
            [
                "Sanitized to avoid secrets",
                "With credentials intact",
                "On public paste sites",
                "Without context",
            ],
            0,
        ),
        (
            "A retest should\u2026",
            [
                "Confirm the fix and check related paths safely",
                "Repeat against production without scope",
                "Delete logs",
                "Assume success",
            ],
            0,
        ),
        (
            "A responsible report prioritizes\u2026",
            [
                "Reproducible evidence and actionable fixes",
                "The number of tools used",
                "Claimed expertise",
                "A dramatic title",
            ],
            0,
        ),
    ],
}

VALID_SEVERITIES = frozenset(
    {"Critical", "High", "Medium", "Low", "Informational"}
)
VALID_REVIEW_DECISIONS = frozenset({"verified", "rejected", "needs_changes"})
VALID_INVITATION_STATUSES = frozenset({"accepted", "declined"})

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_current_user_id() -> int | None:
    """Safely extract the current user ID from a JWT identity, or None."""
    try:
        identity = get_jwt_identity()
        return int(identity) if identity is not None else None
    except (RuntimeError, ValueError, TypeError):
        return None


def _strip_html(text: str) -> str:
    """Basic HTML tag stripping for defense-in-depth against stored XSS."""
    return re.sub(r"<[^>]+>", "", text)


def audit(event: str, detail: str = "") -> None:
    """Record an audit trail entry. Fails silently if no JWT context."""
    actor_id = _get_current_user_id()
    db.session.add(
        Audit(actor_id=actor_id, event=event, detail=detail[:250])
    )
    db.session.commit()


def role_required(*roles: str):
    """Decorator that enforces role-based access on a route."""

    def decorate(fn):
        @wraps(fn)
        @jwt_required()
        def wrapped(*args, **kwargs):
            user_id = _get_current_user_id()
            if user_id is None:
                return jsonify(error="Invalid authentication token."), 401

            user = db.session.get(User, user_id)
            if not user or user.role not in roles:
                return jsonify(error="Forbidden"), 403

            return fn(*args, **kwargs)

        return wrapped

    return decorate


@jwt.token_in_blocklist_loader
def is_token_revoked(_jwt_header, jwt_payload):
    return TokenBlocklist.query.filter_by(jti=jwt_payload["jti"]).first() is not None


# ---------------------------------------------------------------------------
# Security Headers (applied to every response)
# ---------------------------------------------------------------------------


@app.after_request
def set_security_headers(response):
    """Add standard security headers to all responses."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' "
        "https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; connect-src 'self'"
    )
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/")
def index():
    """Root endpoint for status check."""
    return jsonify(
        status="ok",
        service="ProofForge Cyber API",
        version="1.0.0",
        health_check="/api/health"
    )


@app.get("/api/health")
def health():
    """Simple health check endpoint."""
    return jsonify(
        status="ok", service="ProofForge Cyber API", lab_mode="isolated-demo"
    )


@app.post("/api/auth/register")
@limiter.limit("5 per minute")
def register():
    """Register a new candidate account."""
    d = request.get_json(silent=True) or {}
    role = d.get("role")

    # Public registration must never let a new account grant itself
    # reviewer or recruiter privileges.
    if role not in (None, "candidate"):
        return (
            jsonify(
                error="Public registration is candidate-only; "
                "staff accounts must be provisioned by an administrator."
            ),
            403,
        )

    name = (d.get("name") or "").strip()
    email = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""

    if not name or not email or len(password) < 12:
        return (
            jsonify(
                error="Name, email and a password of at least "
                "12 characters are required."
            ),
            400,
        )

    # Validate email format
    if not EMAIL_REGEX.match(email):
        return jsonify(error="A valid email address is required."), 400

    if User.query.filter_by(email=email).first():
        return jsonify(error="Email already registered."), 409

    user = User(
        name=name[:100],
        email=email,
        password=generate_password_hash(password, method="scrypt"),
        role="candidate",
    )
    db.session.add(user)
    db.session.commit()

    return (
        jsonify(
            access_token=create_access_token(identity=str(user.id)),
            role=user.role,
            name=user.name,
        ),
        201,
    )


@app.post("/api/auth/login")
@limiter.limit("8 per minute")
def login():
    """Authenticate and return a JWT."""
    d = request.get_json(silent=True) or {}
    email = (d.get("email") or "").strip().lower()
    password = d.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify(error="Invalid email or password."), 401

    return jsonify(
        access_token=create_access_token(identity=str(user.id)),
        role=user.role,
        name=user.name,
    )


@app.get("/api/auth/me")
@jwt_required()
def current_user():
    user_id = _get_current_user_id()
    user = db.session.get(User, user_id) if user_id else None
    if not user:
        return jsonify(error="Invalid authentication token."), 401
    return jsonify(id=user.id, name=user.name, email=user.email, role=user.role)


@app.post("/api/auth/logout")
@jwt_required()
def logout():
    db.session.add(TokenBlocklist(jti=get_jwt()["jti"]))
    db.session.commit()
    return jsonify(message="Signed out.")


@app.get("/api/labs")
@jwt_required()
def get_labs():
    """Return the list of available training labs."""
    lab_names = [
        "Broken Authentication",
        "Broken Access Control / IDOR",
        "Reflected XSS",
        "SQL Injection",
        "API Authorization",
        "Network Enumeration",
    ]
    return jsonify(
        labs=[
            {
                "id": i + 1,
                "name": name,
                "target": "isolated ProofForge training container",
                "resettable": True,
            }
            for i, name in enumerate(lab_names)
        ]
    )


@app.post("/api/submissions")
@limiter.limit("10 per hour")
@role_required("candidate")
def submit():
    """Submit a new vulnerability finding."""
    d = request.get_json(silent=True) or {}

    required_fields = (
        "lab",
        "vulnerability",
        "category",
        "component",
        "severity",
        "description",
        "evidence",
        "reproduction",
        "impact",
        "recommendation",
    )

    # Validate all required fields are non-empty strings
    if any(
        not isinstance(d.get(k), str) or not d[k].strip()
        for k in required_fields
    ):
        return (
            jsonify(
                error="All finding, evidence, reproduction, impact "
                "and remediation fields are required."
            ),
            400,
        )

    if d["severity"] not in VALID_SEVERITIES:
        return jsonify(error="Invalid severity."), 400

    # Sanitize text fields (strip HTML tags as defense-in-depth)
    evidence = _strip_html(d["evidence"][:12000])
    digest = hashlib.sha256(evidence.encode()).hexdigest()

    user_id = _get_current_user_id()
    if user_id is None:
        return jsonify(error="Invalid authentication token."), 401

    # Check for duplicate evidence
    duplicate = Submission.query.filter_by(
        candidate_id=user_id, evidence_hash=digest
    ).first()
    if duplicate:
        db.session.add(
            Audit(
                actor_id=user_id,
                event="duplicate_evidence",
                detail=f"submission:{duplicate.id}",
            )
        )
        db.session.commit()
        return (
            jsonify(
                error="Duplicate evidence flagged for reviewer verification."
            ),
            409,
        )

    # Enforce submission limit
    prior = Submission.query.filter_by(candidate_id=user_id).count()
    if prior >= 20:
        db.session.add(
            Audit(
                actor_id=user_id,
                event="submission_rate_flag",
                detail=f"count:{prior}",
            )
        )
        db.session.commit()
        return (
            jsonify(
                error="Submission limit reached. "
                "Ask a reviewer to review your queue."
            ),
            429,
        )

    submission = Submission(
        candidate_id=user_id,
        lab=_strip_html(d["lab"][:120]),
        vulnerability=_strip_html(d["vulnerability"][:120]),
        category=_strip_html(d["category"][:80]),
        component=_strip_html(d["component"][:200]),
        severity=d["severity"],
        description=_strip_html(d["description"][:5000]),
        evidence=evidence,
        evidence_hash=digest,
        reproduction=_strip_html(d["reproduction"][:5000]),
        impact=_strip_html(d["impact"][:3000]),
        recommendation=_strip_html(d["recommendation"][:3000]),
        references=_strip_html(d.get("references", "")[:1000]),
    )
    db.session.add(submission)
    db.session.commit()

    audit("submission_created", f"id:{submission.id}")

    return jsonify(id=submission.id, status=submission.status), 201


@app.get("/api/submissions")
@jwt_required()
def submissions():
    """List submissions. Candidates see only their own; reviewers see all."""
    user_id = _get_current_user_id()
    if user_id is None:
        return jsonify(error="Invalid authentication token."), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404

    query = Submission.query.order_by(Submission.created.desc())

    if user.role == "candidate":
        query = query.filter_by(candidate_id=user.id)
    elif user.role not in ("reviewer", "recruiter"):
        return jsonify(error="Forbidden"), 403

    if user.role == "recruiter":
        return jsonify(submissions=[_proof_record(s, recruiter_safe=True) for s in query.filter_by(status="verified").limit(100)])

    return jsonify(
        submissions=[
            {
                "id": s.id,
                "candidate_id": s.candidate_id,
                "lab": s.lab,
                "vulnerability": s.vulnerability,
                "category": s.category,
                "severity": s.severity,
                "description": s.description,
                "evidence": s.evidence,
                "evidence_hash": s.evidence_hash,
                "reproduction": s.reproduction,
                "impact": s.impact,
                "recommendation": s.recommendation,
                "status": s.status,
                "score": s.score,
            }
            for s in query.limit(100)
        ]
    )


@app.post("/api/submissions/<int:sid>/review")
@role_required("reviewer")
def review(sid: int):
    """Submit a reviewer decision and score for a finding."""
    submission = db.session.get(Submission, sid)
    if not submission:
        return jsonify(error="Submission not found."), 404

    d = request.get_json(silent=True) or {}
    score = d.get("score")
    decision = d.get("decision")

    if (
        not isinstance(score, int)
        or not 0 <= score <= 100
        or decision not in VALID_REVIEW_DECISIONS
    ):
        return (
            jsonify(
                error="A valid reviewer decision and score (0\u2013100) "
                "are required."
            ),
            400,
        )

    report_quality = d.get("report_quality", 0)
    evidence_consistency = d.get("evidence_consistency", 0)
    if any(not isinstance(value, int) or not 0 <= value <= 100 for value in (report_quality, evidence_consistency)):
        return jsonify(error="Rubric scores must be integers from 0 to 100."), 400
    submission.score = score
    submission.status = decision
    metrics = ReviewerMetrics.query.filter_by(submission_id=sid).first()
    if metrics is None:
        metrics = ReviewerMetrics(submission_id=sid, reviewer_id=_get_current_user_id())
        db.session.add(metrics)
    metrics.reviewer_id = _get_current_user_id()
    metrics.report_quality = report_quality
    metrics.evidence_consistency = evidence_consistency
    db.session.commit()

    audit(
        "review_finalized",
        f"submission:{sid}:{submission.status}:{score}",
    )

    return jsonify(
        id=submission.id,
        status=submission.status,
        reviewer_score=score,
    )


@app.get("/api/submissions/<int:sid>/defense")
@role_required("candidate", "reviewer")
def get_defense(sid: int):
    submission = db.session.get(Submission, sid)
    user_id = _get_current_user_id()
    user = db.session.get(User, user_id) if user_id else None
    if not submission or not user or (user.role == "candidate" and submission.candidate_id != user.id):
        return jsonify(error="Submission not found."), 404
    return jsonify(questions=[{
        "id": item.id, "question": item.question, "answer": item.answer,
        "reviewer_score": item.reviewer_score, "reviewer_note": item.reviewer_note,
    } for item in DefenseQuestion.query.filter_by(submission_id=sid).order_by(DefenseQuestion.id).all()])


@app.post("/api/submissions/<int:sid>/defense")
@limiter.limit("30 per hour")
@role_required("reviewer")
def ask_defense(sid: int):
    submission = db.session.get(Submission, sid)
    if not submission:
        return jsonify(error="Submission not found."), 404
    d = request.get_json(silent=True) or {}
    question = _strip_html(str(d.get("question", "")).strip())
    if not question or len(question) > 500:
        return jsonify(error="A concise defense question (1–500 characters) is required."), 400
    prompt = DefenseQuestion(submission_id=sid, reviewer_id=_get_current_user_id(), question=question)
    db.session.add(prompt); db.session.commit(); audit("defense_question_asked", f"submission:{sid}")
    return jsonify(id=prompt.id, question=prompt.question, answer=None), 201


@app.patch("/api/defense/<int:qid>/answer")
@role_required("candidate")
def answer_defense(qid: int):
    item = db.session.get(DefenseQuestion, qid)
    user_id = _get_current_user_id()
    if not item or item.submission.candidate_id != user_id:
        return jsonify(error="Defense question not found."), 404
    d = request.get_json(silent=True) or {}
    answer = _strip_html(str(d.get("answer", "")).strip())
    if not answer or len(answer) > 3000:
        return jsonify(error="An answer (1–3000 characters) is required."), 400
    if item.answer is not None or item.reviewer_score is not None:
        return jsonify(error="This defense response is already submitted and locked. Ask the reviewer for a new question if you need to clarify."), 409
    item.answer = answer; db.session.commit(); audit("defense_answer_submitted", f"question:{qid}")
    return jsonify(id=item.id, status="submitted")


@app.patch("/api/defense/<int:qid>/evaluate")
@role_required("reviewer")
def evaluate_defense(qid: int):
    item = db.session.get(DefenseQuestion, qid)
    if not item:
        return jsonify(error="Defense question not found."), 404
    d = request.get_json(silent=True) or {}
    score = d.get("score")
    if not isinstance(score, int) or not 0 <= score <= 100 or not item.answer:
        return jsonify(error="A submitted answer and reviewer score from 0–100 are required."), 400
    item.reviewer_score = score
    item.reviewer_note = _strip_html(str(d.get("note", ""))[:1000])
    db.session.commit(); audit("defense_answer_evaluated", f"question:{qid}:score:{score}")
    return jsonify(id=item.id, reviewer_score=score)


def _skill_fingerprint(candidate_id: int) -> dict:
    """Deterministic metrics derived only from reviewed findings and scored assessments."""
    domains = ["Web Security", "API Security", "Network Security", "Reconnaissance", "Linux Security",
               "Vulnerability Assessment", "Penetration Testing", "Security Reporting", "Incident Response / Blue Team"]
    aliases = {
        "Web Security": ("web", "xss", "sql", "auth", "access control"),
        "API Security": ("api", "authorization", "idor"),
        "Network Security": ("network", "enumeration", "service"),
        "Reconnaissance": ("recon", "enumeration", "discovery"),
        "Linux Security": ("linux", "privilege", "shell"),
        "Vulnerability Assessment": ("vulnerability", "assessment", "injection", "access control"),
        "Penetration Testing": ("penetration", "pentest", "lab", "xss", "injection"),
        "Security Reporting": ("report", "evidence", "access control", "xss", "injection"),
        "Incident Response / Blue Team": ("incident", "response", "soc", "forensic", "defense"),
    }
    assessment_for = {
        "Web Security": "Cybersecurity Fundamentals", "API Security": "Cybersecurity Fundamentals",
        "Network Security": "Ethical Hacking & Pentesting", "Reconnaissance": "Ethical Hacking & Pentesting",
        "Linux Security": "Cybersecurity Fundamentals", "Vulnerability Assessment": "Cybersecurity Fundamentals",
        "Penetration Testing": "Ethical Hacking & Pentesting", "Security Reporting": "English & Security Communication",
        "Incident Response / Blue Team": "Cybersecurity Fundamentals",
    }
    lab_difficulty = {"broken authentication": 2, "api authorization": 3, "network enumeration": 1,
                      "reflected xss": 2, "sql injection": 3, "access control": 2}
    findings = Submission.query.filter_by(candidate_id=candidate_id).all()
    verified = [f for f in findings if f.status == "verified"]
    assessments = {a.section: a.percent for a in AssessmentResult.query.filter_by(candidate_id=candidate_id).all()}
    defense_rows = DefenseQuestion.query.join(Submission).filter(Submission.candidate_id == candidate_id, DefenseQuestion.reviewer_score.isnot(None)).all()
    defense_avg = round(sum(x.reviewer_score for x in defense_rows) / len(defense_rows)) if defense_rows else 0
    reviewer_avg = round(sum(f.score or 0 for f in verified) / len(verified)) if verified else 0
    assessment_avg = round(sum(assessments.values()) / len(assessments)) if assessments else 0
    overall = round(reviewer_avg * .8 + assessment_avg * .2) if verified else round(assessment_avg * .2)
    result = []
    for domain in domains:
        terms = aliases[domain]
        matching = [f for f in verified if any(t in (f.category + " " + f.lab + " " + f.vulnerability).lower() for t in terms)]
        relevant_assessment = assessments.get(assessment_for[domain], 0)
        if not matching and not relevant_assessment:
            capability = confidence = 0
        else:
            review_avg = round(sum(f.score or 0 for f in matching) / len(matching)) if matching else 0
            difficulty_bonus = round(sum(next((value for lab, value in lab_difficulty.items() if lab in f.lab.lower()), 1) for f in matching) / len(matching)) if matching else 0
            capability = min(100, round(review_avg * .66 + min(len(matching), 3) * 6 + relevant_assessment * .12 + defense_avg * .08 + difficulty_bonus))
            consistency = round(100 * len(verified) / len(findings)) if findings else 0
            confidence = min(100, round(35 + min(len(matching), 4) * 12 + consistency * .2 + (15 if all(f.evidence and f.reproduction for f in matching) else 0) + (8 if defense_rows else 0))) if matching else 0
        result.append({"skill": domain, "capability": capability, "proof_confidence": confidence, "verified_findings": len(matching)})
    accuracy = round(100 * len(verified) / len(findings)) if findings else 0
    verified_score = round(sum(f.score or 0 for f in verified) / len(verified)) if verified else 0
    duplicate_count = Audit.query.filter_by(actor_id=candidate_id, event="duplicate_evidence").count()
    report_complete = round(100 * sum(bool(f.description and f.evidence and f.reproduction and f.impact and f.recommendation) for f in findings) / len(findings)) if findings else 0
    evidence_complete = round(100 * sum(bool(f.evidence and f.reproduction) for f in findings) / len(findings)) if findings else 0
    rubric_rows = ReviewerMetrics.query.join(Submission).filter(Submission.candidate_id == candidate_id).all()
    report_quality = round(sum(x.report_quality for x in rubric_rows) / len(rubric_rows)) if rubric_rows else 0
    evidence_consistency = round(sum(x.evidence_consistency for x in rubric_rows) / len(rubric_rows)) if rubric_rows else 0
    confidence = min(100, max(0, round(18 + min(len(verified), 5) * 6 + verified_score * .18 + report_complete * .1 + evidence_complete * .1 + (10 if defense_rows else 0) - min(duplicate_count, 5) * 5))) if verified else 0
    return {"skills": result, "overall_capability": overall, "proof_confidence": confidence,
            "total_submitted": len(findings), "verified_findings": len(verified), "finding_accuracy": accuracy,
            "false_positives": sum(f.status == "rejected" for f in findings), "duplicate_flags": duplicate_count,
            "evidence_completeness": evidence_complete, "report_completeness": report_complete,
            "defense_consistency": defense_avg, "evidence_consistency": evidence_consistency,
            "suspicion_flags": Audit.query.filter(Audit.actor_id == candidate_id, Audit.event.in_(["duplicate_evidence", "submission_rate_flag"])).count(),
            "reviewer_verification": bool(verified), "technical_defense_score": defense_avg, "report_quality": report_quality,
            "report_completeness": report_complete}


@app.get("/api/candidate/security-dna")
@role_required("candidate")
def candidate_security_dna():
    return jsonify(_skill_fingerprint(_get_current_user_id()))


@app.get("/api/candidate/proof")
@role_required("candidate")
def candidate_proof():
    user_id = _get_current_user_id()
    return jsonify(findings=[_proof_record(s) for s in Submission.query.filter_by(candidate_id=user_id).order_by(Submission.created.desc()).limit(100)])


@app.get("/api/candidate/progress")
@role_required("candidate")
def candidate_progress():
    """Return this candidate's saved proof metrics and assessment results."""
    user_id = _get_current_user_id()
    summary = _skill_fingerprint(user_id)
    assessments = AssessmentResult.query.filter_by(candidate_id=user_id).order_by(AssessmentResult.section).all()
    return jsonify(
        overall_capability=summary["overall_capability"],
        proof_confidence=summary["proof_confidence"],
        total_submitted=summary["total_submitted"],
        verified_findings=summary["verified_findings"],
        finding_accuracy=summary["finding_accuracy"],
        assessments=[{"section": row.section, "percent": row.percent, "correct": row.percent // 10, "total": 10} for row in assessments],
    )


@app.get("/api/candidate/recommendations")
@role_required("candidate")
def challenge_recommendation():
    dna = _skill_fingerprint(_get_current_user_id())["skills"]
    strongest = sorted(dna, key=lambda item: item["capability"], reverse=True)[:2]
    lab_for = {"API Security": "API Authorization", "Network Security": "Network Enumeration", "Reconnaissance": "Network Enumeration", "Web Security": "Broken Authentication", "Linux Security": "Network Enumeration", "Security Reporting": "Broken Access Control", "Vulnerability Assessment": "SQL Injection", "Penetration Testing": "API Authorization", "Incident Response / Blue Team": "Network Enumeration"}
    weakest = min(dna, key=lambda item: (item["capability"], item["proof_confidence"]))
    return jsonify(strong_skills=[s["skill"] for s in strongest if s["capability"] > 0],
                   skill_gap=weakest["skill"], recommended_lab=lab_for[weakest["skill"]],
                   rationale="Recommended from verified findings, reviewer scores and saved assessment results. Recommendation only; no score changes until evidence is reviewed.",
                   authorized_target_only=True)


def _proof_record(s: Submission, recruiter_safe: bool = False) -> dict:
    answers = DefenseQuestion.query.filter_by(submission_id=s.id).order_by(DefenseQuestion.id).all()
    redact = lambda value: re.sub(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+|([\w.+-]+)@([\w.-]+\.[A-Za-z]{2,})|(password|token|api[_-]?key)\s*[:=]\s*\S+", "[REDACTED]", value or "")
    row = {"id": s.id, "lab": s.lab, "finding": s.vulnerability, "category": s.category, "severity": s.severity,
           "description": redact(s.description) if recruiter_safe else s.description, "evidence": "Sanitized evidence reviewed in the authorized lab." if recruiter_safe else s.evidence,
           "reproduction": redact(s.reproduction) if recruiter_safe else s.reproduction, "impact": redact(s.impact) if recruiter_safe else s.impact, "remediation": redact(s.recommendation) if recruiter_safe else s.recommendation, "status": s.status, "reviewer_score": s.score,
           "defense": [{"question": redact(x.question) if recruiter_safe else x.question, "answer": redact(x.answer) if recruiter_safe else x.answer, "reviewer_score": x.reviewer_score} for x in answers]}
    return row


@app.get("/api/assessments/<section>")
@role_required("candidate")
def assessment(section: str):
    """Return questions for an assessment section (answers omitted)."""
    questions = ASSESSMENTS.get(section)
    if not questions:
        return jsonify(error="Unknown assessment section."), 404

    # Deliberately omit answer indexes from all candidate responses.
    return jsonify(
        section=section,
        questions=[
            {"id": i + 1, "question": q, "options": opts}
            for i, (q, opts, _) in enumerate(questions)
        ],
    )


@app.post("/api/assessments/<section>/score")
@role_required("candidate")
def score_assessment(section: str):
    """Score a candidate's assessment submission."""
    questions = ASSESSMENTS.get(section)
    if not questions:
        return jsonify(error="Unknown assessment section."), 404

    d = request.get_json(silent=True) or {}
    answers = d.get("answers")

    if (
        not isinstance(answers, list)
        or len(answers) != 10
        or any(not isinstance(a, int) or a < -1 or a > 3 for a in answers)
    ):
        return jsonify(error="Submit exactly 10 option indexes (use -1 for unanswered questions)."), 400

    correct = sum(
        answer == item[2] for answer, item in zip(answers, questions)
    )
    result = AssessmentResult.query.filter_by(candidate_id=_get_current_user_id(), section=section).first()
    if result is None:
        result = AssessmentResult(candidate_id=_get_current_user_id(), section=section, percent=correct * 10)
        db.session.add(result)
    else:
        result.percent = correct * 10
    db.session.commit()
    audit("assessment_scored", section)

    return jsonify(
        section=section,
        correct=correct,
        total=10,
        percent=correct * 10,
    )


@app.post("/api/invitations")
@role_required("recruiter")
def invite():
    """Send an interview invitation to a candidate."""
    d = request.get_json(silent=True) or {}

    required_fields = (
        "candidate_id",
        "role",
        "message",
        "interview_type",
        "scheduled_at",
    )
    if not all(d.get(x) for x in required_fields):
        return jsonify(error="All invitation fields are required."), 400

    # Validate candidate_id is an integer
    candidate_id = d.get("candidate_id")
    if not isinstance(candidate_id, int):
        return jsonify(error="candidate_id must be an integer."), 400

    candidate = db.session.get(User, candidate_id)
    if not candidate or candidate.role != "candidate":
        return jsonify(error="Candidate not found."), 404

    recruiter_id = _get_current_user_id()
    if recruiter_id is None:
        return jsonify(error="Invalid authentication token."), 401

    invitation = Invitation(
        recruiter_id=recruiter_id,
        candidate_id=candidate.id,
        role=_strip_html(d["role"][:120]),
        message=_strip_html(d["message"][:2000]),
        interview_type=_strip_html(d["interview_type"][:30]),
        scheduled_at=d["scheduled_at"][:40],
    )
    db.session.add(invitation)
    db.session.commit()

    audit("interview_invited", f"invitation:{invitation.id}")

    return jsonify(id=invitation.id, status=invitation.status), 201


@app.get("/api/invitations")
@role_required("candidate", "recruiter")
def get_invitations():
    user_id = _get_current_user_id()
    user = db.session.get(User, user_id) if user_id else None
    if not user:
        return jsonify(error="User not found."), 404
    column = Invitation.candidate_id if user.role == "candidate" else Invitation.recruiter_id
    items = Invitation.query.filter(column == user.id).order_by(Invitation.id.desc()).limit(100).all()
    return jsonify(invitations=[{"id": x.id, "candidate_id": x.candidate_id, "recruiter_id": x.recruiter_id, "role": x.role, "message": x.message, "interview_type": x.interview_type, "scheduled_at": x.scheduled_at, "status": x.status} for x in items])


@app.patch("/api/invitations/<int:iid>")
@role_required("candidate")
def respond(iid: int):
    """Accept or decline an interview invitation."""
    user_id = _get_current_user_id()
    if user_id is None:
        return jsonify(error="Invalid authentication token."), 401

    invitation = db.session.get(Invitation, iid)
    if not invitation or invitation.candidate_id != user_id:
        return jsonify(error="Invitation not found."), 404

    d = request.get_json(silent=True) or {}
    new_status = d.get("status")

    if new_status not in VALID_INVITATION_STATUSES:
        return (
            jsonify(error="Status must be accepted or declined."),
            400,
        )

    invitation.status = new_status
    db.session.commit()

    audit(
        "invitation_responded",
        f"id:{iid}:{invitation.status}",
    )

    return jsonify(id=invitation.id, status=invitation.status)


@app.get("/api/recruiter/candidates")
@role_required("recruiter")
def candidates():
    """Return only candidates explicitly passed by a reviewer."""
    try:
        min_capability = max(0, min(100, int(request.args.get("min_capability", 0))))
        min_confidence = max(0, min(100, int(request.args.get("min_proof_confidence", 0))))
        min_accuracy = max(0, min(100, int(request.args.get("min_accuracy", 0))))
        skill = request.args.get("skill", "").strip()[:100]
        min_skill = max(0, min(100, int(request.args.get("min_skill", 0))))
    except ValueError:
        return jsonify(error="Score filters must be integers from 0 to 100."), 400
    results = []
    approvals = RecruiterCandidateApproval.query.order_by(RecruiterCandidateApproval.approved_at.desc()).limit(100).all()
    for approval in approvals:
        u = db.session.get(User, approval.candidate_id)
        if not u or u.role != "candidate":
            continue
        dna = _skill_fingerprint(u.id)
        skill_score = next((s["capability"] for s in dna["skills"] if s["skill"].casefold() == skill.casefold()), None) if skill else None
        if dna["overall_capability"] < min_capability or dna["proof_confidence"] < min_confidence or dna["finding_accuracy"] < min_accuracy:
            continue
        if skill and (skill_score is None or skill_score < min_skill):
            continue
        verified_rows = Submission.query.filter_by(candidate_id=u.id, status="verified").all()
        why = [f"Capability {dna['overall_capability']} meets {min_capability}+ requirement",
               f"Proof confidence {dna['proof_confidence']} meets {min_confidence}+ requirement",
               f"Finding accuracy {dna['finding_accuracy']}% meets {min_accuracy}%+ requirement"]
        if skill:
            why.append(f"Verified {skill} capability {skill_score} meets {min_skill}+ requirement")
        results.append({"id": u.id, "name": u.name, "role": "Security Candidate", "security_dna": dna["skills"],
            "security_capability": dna["overall_capability"], "proof_confidence": dna["proof_confidence"],
            "verified_findings": dna["verified_findings"], "total_submitted": dna["total_submitted"],
            "finding_accuracy": dna["finding_accuracy"], "false_positives": dna["false_positives"],
            "duplicate_flags": dna["duplicate_flags"], "report_quality": dna["report_quality"],
            "technical_defense_score": dna["technical_defense_score"], "reviewer_verification": dna["reviewer_verification"],
            "verified_labs": sorted({s.lab for s in verified_rows}), "verified_tools": [], "why_matched": why})
    return jsonify(candidates=results, match_basis="reviewer-approved candidates only; scores come from server-side reviewed evidence")


@app.get("/api/reviewer/candidate-approvals")
@role_required("reviewer")
def reviewer_candidate_approvals():
    approved_ids = {row.candidate_id for row in RecruiterCandidateApproval.query.all()}
    candidates = User.query.filter_by(role="candidate").order_by(User.name.asc()).all()
    return jsonify(candidates=[{"id": user.id, "name": user.name, "email": user.email, "approved": user.id in approved_ids} for user in candidates])


@app.post("/api/reviewer/candidate-approvals")
@role_required("reviewer")
def update_reviewer_candidate_approval():
    data = request.get_json(silent=True) or {}
    candidate_id = data.get("candidate_id")
    email = str(data.get("email", "")).strip().lower()
    approved = data.get("approved")
    if not isinstance(approved, bool):
        return jsonify(error="approved must be true or false."), 400
    candidate = db.session.get(User, candidate_id) if isinstance(candidate_id, int) else None
    if candidate is None and email:
        candidate = User.query.filter_by(email=email, role="candidate").first()
    if not candidate or candidate.role != "candidate":
        return jsonify(error="Candidate account not found."), 404
    existing = RecruiterCandidateApproval.query.filter_by(candidate_id=candidate.id).first()
    if approved and not existing:
        db.session.add(RecruiterCandidateApproval(candidate_id=candidate.id, reviewer_id=_get_current_user_id()))
    elif not approved and existing:
        db.session.delete(existing)
    db.session.commit()
    return jsonify(candidate={"id": candidate.id, "name": candidate.name, "email": candidate.email, "approved": approved})


@app.get("/api/recruiter/candidates/<int:candidate_id>/proof")
@role_required("recruiter")
def recruiter_proof(candidate_id: int):
    if not RecruiterCandidateApproval.query.filter_by(candidate_id=candidate_id).first():
        return jsonify(error="Candidate has not been passed to the recruiter roster."), 404
    candidate = db.session.get(User, candidate_id)
    if not candidate or candidate.role != "candidate":
        return jsonify(error="Candidate not found."), 404
    dna = _skill_fingerprint(candidate.id)
    records = Submission.query.filter_by(candidate_id=candidate.id, status="verified").order_by(Submission.created.desc()).limit(100).all()
    return jsonify(candidate={"id": candidate.id, "name": candidate.name}, security_dna=dna,
                   proof_chain=[_proof_record(s, recruiter_safe=True) for s in records])


@app.post("/api/documents")
@jwt_required()
def upload_document():
    """Upload a candidate security report document (PDF / Word)."""
    user_id = _get_current_user_id()
    if user_id is None:
        return jsonify(error="Invalid authentication token."), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404

    d = request.get_json(silent=True) or {}
    title = (d.get("title") or "").strip()[:200]
    file_name = (d.get("file_name") or "").strip()[:255]
    file_data = d.get("file_data") or ""
    doc_type = (d.get("doc_type") or "").strip().lower()
    lab = (d.get("lab") or "Security Assessment").strip()[:120]
    severity = (d.get("severity") or "High").strip()[:20]
    description = (d.get("description") or "").strip()[:5000]

    if not title or not file_name or not file_data:
        return jsonify(error="Title, file name, and file data are required."), 400

    if doc_type not in ("pdf", "docx", "doc"):
        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        if ext in ("pdf", "docx", "doc"):
            doc_type = ext
        else:
            return jsonify(error="Only PDF (.pdf) and Word documents (.doc, .docx) are supported."), 400

    file_size = int(d.get("file_size") or (len(file_data) * 3 // 4))

    doc = CandidateDocument(
        candidate_id=user.id,
        candidate_name=user.name,
        title=_strip_html(title),
        lab=_strip_html(lab),
        severity=_strip_html(severity),
        doc_type=doc_type,
        file_name=_strip_html(file_name),
        file_size=file_size,
        file_data=file_data,
        description=_strip_html(description),
        status="pending",
    )
    db.session.add(doc)
    db.session.commit()

    audit("document_uploaded", f"doc_id:{doc.id},name:{doc.file_name}")
    return jsonify(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        doc_type=doc.doc_type,
        file_size=doc.file_size,
        status=doc.status,
        created_at=doc.created_at.isoformat() + "Z" if doc.created_at else None,
        message="Document uploaded successfully and routed to reviewer queue."
    ), 201


@app.get("/api/documents")
@jwt_required()
def list_documents():
    """List uploaded security documents. Candidates see their own; Reviewers & Recruiters see all."""
    user_id = _get_current_user_id()
    if user_id is None:
        return jsonify(error="Invalid authentication token."), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404

    query = CandidateDocument.query.order_by(CandidateDocument.created_at.desc())
    if user.role == "candidate":
        query = query.filter_by(candidate_id=user.id)

    docs = query.limit(100).all()
    return jsonify(
        documents=[
            {
                "id": doc.id,
                "candidate_id": doc.candidate_id,
                "candidate_name": doc.candidate_name,
                "candidate_email": db.session.get(User, doc.candidate_id).email if doc.candidate_id and db.session.get(User, doc.candidate_id) else "",
                "title": doc.title,
                "lab": doc.lab,
                "severity": doc.severity,
                "doc_type": doc.doc_type,
                "file_name": doc.file_name,
                "file_size": doc.file_size,
                "description": doc.description,
                "status": doc.status,
                "reviewer_score": doc.reviewer_score,
                "reviewer_feedback": doc.reviewer_feedback,
                "reviewed_by": doc.reviewed_by,
                "reviewed_at": doc.reviewed_at.isoformat() + "Z" if doc.reviewed_at else None,
                "created_at": doc.created_at.isoformat() + "Z" if doc.created_at else None,
            }
            for doc in docs
        ]
    )


@app.get("/api/documents/<int:doc_id>/content")
@jwt_required()
def get_document_content(doc_id: int):
    """Retrieve full file data for viewing or downloading."""
    user_id = _get_current_user_id()
    if user_id is None:
        return jsonify(error="Invalid authentication token."), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404

    doc = db.session.get(CandidateDocument, doc_id)
    if not doc:
        return jsonify(error="Document not found."), 404
    if user.role == "candidate" and doc.candidate_id != user.id:
        return jsonify(error="Forbidden"), 403

    return jsonify(
        id=doc.id,
        file_name=doc.file_name,
        doc_type=doc.doc_type,
        file_data=doc.file_data,
        title=doc.title,
    )


@app.post("/api/documents/<int:doc_id>/review")
@role_required("reviewer")
def review_document(doc_id: int):
    """Review and score an uploaded candidate document."""
    doc = db.session.get(CandidateDocument, doc_id)
    if not doc:
        return jsonify(error="Document not found."), 404

    d = request.get_json(silent=True) or {}
    score = d.get("score")
    decision = d.get("decision")  # "verified", "needs_changes", "rejected"
    feedback = (d.get("feedback") or "").strip()[:2000]

    if not isinstance(score, int) or not (0 <= score <= 100):
        return jsonify(error="A score between 0 and 100 is required."), 400
    if decision not in ("verified", "needs_changes", "rejected"):
        return jsonify(error="Decision must be 'verified', 'needs_changes', or 'rejected'."), 400

    reviewer_id = _get_current_user_id()
    reviewer = db.session.get(User, reviewer_id) if reviewer_id else None

    doc.reviewer_score = score
    doc.status = decision
    doc.reviewer_feedback = _strip_html(feedback)
    doc.reviewed_by = reviewer.name if reviewer else "Reviewer"
    doc.reviewed_at = datetime.utcnow()
    db.session.commit()

    audit("document_reviewed", f"doc_id:{doc.id},status:{doc.status},score:{score}")
    return jsonify(
        id=doc.id,
        status=doc.status,
        reviewer_score=doc.reviewer_score,
        reviewer_feedback=doc.reviewer_feedback,
        reviewed_by=doc.reviewed_by,
        message="Review recorded successfully."
    )


@app.post("/api/demo/reset")
@role_required("recruiter")
def reset_demo_candidate():
    """Recruiter-only full wipe of candidate outcomes and role workflow data; preserve accounts and target/policy setup."""
    SecureAssessmentEvent.query.delete(synchronize_session=False)
    SecureAssessment.query.delete(synchronize_session=False)
    DefenseQuestion.query.delete(synchronize_session=False)
    ReviewerMetrics.query.delete(synchronize_session=False)
    Submission.query.delete(synchronize_session=False)
    AssessmentResult.query.delete(synchronize_session=False)
    CandidateDocument.query.delete(synchronize_session=False)
    Invitation.query.delete(synchronize_session=False)
    RecruiterCandidateApproval.query.delete(synchronize_session=False)
    Audit.query.delete(synchronize_session=False)
    db.session.commit()
    return jsonify(
        message="Candidate results, review records, legacy monitoring records, recruiter approvals, interviews, and audit entries were reset. User accounts were preserved.",
        status="clean",
        reset_at=datetime.utcnow().isoformat() + "Z",
    )


# ---------------------------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------------------------


@app.errorhandler(400)
def bad_request(e):
    return jsonify(error="Bad request."), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Resource not found."), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify(error="Method not allowed."), 405


@app.errorhandler(413)
def too_large(e):
    return jsonify(error="Payload exceeds the 2 MB upload limit."), 413


@app.errorhandler(429)
def rate_limited(e):
    return jsonify(error="Too many requests. Please try again later."), 429


@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="An internal error occurred."), 500


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5000")), debug=False)
