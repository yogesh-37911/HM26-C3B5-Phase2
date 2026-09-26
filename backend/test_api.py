"""
Comprehensive Integration and Unit tests for ProofForge Cyber API.
Tests all endpoints, authentication, RBAC, input validation, and business logic.
"""

import json
import os
import sys
import unittest
from pathlib import Path

# Add project root and backend dir to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Ensure in-memory or test database is used
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-32-chars-long-abc!"
os.environ["RATELIMIT_STORAGE_URI"] = "memory://"

from werkzeug.security import generate_password_hash
from app import app, db, limiter, User, Submission, DefenseQuestion, AssessmentResult, Invitation


class TestProofForgeAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        limiter.enabled = False

    def setUp(self):
        self.app_context = app.app_context()
        self.app_context.push()
        db.create_all()
        self.client = app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def _create_user(self, name, email, password, role):
        user = User(
            name=name,
            email=email,
            password=generate_password_hash(password, method="scrypt"),
            role=role,
        )
        db.session.add(user)
        db.session.commit()
        return user

    def _register(self, name, email, password, role=None):
        payload = {
            "name": name,
            "email": email,
            "password": password,
        }
        if role is not None:
            payload["role"] = role
        return self.client.post(
            "/api/auth/register",
            data=json.dumps(payload),
            content_type="application/json",
        )

    def _login(self, email, password):
        res = self.client.post(
            "/api/auth/login",
            data=json.dumps({"email": email, "password": password}),
            content_type="application/json",
        )
        data = res.get_json() or {}
        return data.get("access_token"), res

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "ok")

    def test_auth_registration_validation(self):
        # Valid candidate registration
        res = self._register("Alice Candidate", "alice@example.com", "SecurePass123!", "candidate")
        self.assertEqual(res.status_code, 201)

        # Duplicate email
        res2 = self._register("Alice 2", "alice@example.com", "SecurePass123!", "candidate")
        self.assertEqual(res2.status_code, 409)

        # Invalid email
        res3 = self._register("Bob", "invalid-email", "SecurePass123!", "candidate")
        self.assertEqual(res3.status_code, 400)

        # Short password
        res4 = self._register("Bob", "bob@example.com", "short", "candidate")
        self.assertEqual(res4.status_code, 400)

        # Disallow public registration as privileged role
        res5 = self._register("Bob", "bob@example.com", "SecurePass123!", "reviewer")
        self.assertEqual(res5.status_code, 403)

    def test_auth_login(self):
        self._register("Alice Candidate", "alice@example.com", "SecurePass123!", "candidate")
        
        # Valid login
        token, res = self._login("alice@example.com", "SecurePass123!")
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(token)

        # Invalid password
        _, res_bad = self._login("alice@example.com", "WrongPassword123!")
        self.assertEqual(res_bad.status_code, 401)

        # Non-existent user
        _, res_no = self._login("nobody@example.com", "SecurePass123!")
        self.assertEqual(res_no.status_code, 401)

    def test_labs_endpoint(self):
        self._register("Alice Candidate", "alice@example.com", "SecurePass123!", "candidate")
        token, _ = self._login("alice@example.com", "SecurePass123!")
        headers = {"Authorization": f"Bearer {token}"}

        # Unauthenticated request returns 401
        res_unauth = self.client.get("/api/labs")
        self.assertEqual(res_unauth.status_code, 401)

        # Authenticated request returns labs
        res = self.client.get("/api/labs", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("labs", data)
        self.assertGreaterEqual(len(data["labs"]), 1)

    def test_submission_and_review_workflow(self):
        # 1. Create candidate and reviewer accounts
        self._register("Candidate One", "cand@example.com", "PassCandidate123!", "candidate")
        self._create_user("Reviewer One", "rev@example.com", "PassReviewer123!", "reviewer")

        cand_token, _ = self._login("cand@example.com", "PassCandidate123!")
        rev_token, _ = self._login("rev@example.com", "PassReviewer123!")

        cand_headers = {"Authorization": f"Bearer {cand_token}", "Content-Type": "application/json"}
        rev_headers = {"Authorization": f"Bearer {rev_token}", "Content-Type": "application/json"}

        # 2. Candidate creates a submission
        sub_payload = {
            "lab": "Broken Access Control",
            "vulnerability": "Broken Object Level Auth",
            "category": "API Security",
            "component": "GET /api/user/{id}",
            "severity": "High",
            "description": "Found IDOR allowing unauthorized profile access.",
            "evidence": "HTTP request proof with response payload.",
            "reproduction": "1. Login as user A\n2. Request user B profile.",
            "impact": "Data leak of sensitive PII.",
            "recommendation": "Implement object ownership checks.",
            "references": "CWE-639, OWASP API1:2023"
        }
        sub_res = self.client.post("/api/submissions", data=json.dumps(sub_payload), headers=cand_headers)
        self.assertEqual(sub_res.status_code, 201)
        sub_data = sub_res.get_json()
        sub_id = sub_data.get("id")
        self.assertIsNotNone(sub_id)

        # 3. Candidate lists submissions (sees own)
        list_res = self.client.get("/api/submissions", headers=cand_headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.get_json()), 1)

        # 4. Reviewer reviews submission
        review_payload = {
            "decision": "verified",
            "score": 92,
            "report_quality": 90,
            "evidence_consistency": 95,
        }
        rev_res = self.client.post(f"/api/submissions/{sub_id}/review", data=json.dumps(review_payload), headers=rev_headers)
        self.assertEqual(rev_res.status_code, 200)

        # 5. Reviewer creates defense question
        q_payload = {"question": "How would you remediate this without breaking existing integrations?"}
        q_res = self.client.post(f"/api/submissions/{sub_id}/defense", data=json.dumps(q_payload), headers=rev_headers)
        self.assertEqual(q_res.status_code, 201)
        q_id = q_res.get_json().get("id")

        # 6. Candidate answers defense question
        ans_payload = {"answer": "Use UUIDs and tenant scoped authorization middleware."}
        ans_res = self.client.patch(f"/api/defense/{q_id}/answer", data=json.dumps(ans_payload), headers=cand_headers)
        self.assertEqual(ans_res.status_code, 200)

        # 7. Reviewer evaluates defense answer
        eval_payload = {"score": 95, "note": "Well reasoned response."}
        eval_res = self.client.patch(f"/api/defense/{q_id}/evaluate", data=json.dumps(eval_payload), headers=rev_headers)
        self.assertEqual(eval_res.status_code, 200)

    def test_assessments_and_security_dna(self):
        self._register("Cand Two", "cand2@example.com", "PassCandidate123!", "candidate")
        token, _ = self._login("cand2@example.com", "PassCandidate123!")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Get assessment questions for Aptitude
        q_res = self.client.get("/api/assessments/Aptitude", headers=headers)
        self.assertEqual(q_res.status_code, 200)
        res_data = q_res.get_json()
        self.assertIn("questions", res_data)
        self.assertEqual(len(res_data["questions"]), 10)

        # Submit answers (10 options)
        score_res = self.client.post(
            "/api/assessments/Aptitude/score",
            data=json.dumps({"answers": [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]}),
            headers=headers,
        )
        self.assertEqual(score_res.status_code, 200)
        self.assertEqual(score_res.get_json().get("total"), 10)

        # Check candidate Security DNA & Proof
        dna_res = self.client.get("/api/candidate/security-dna", headers=headers)
        self.assertEqual(dna_res.status_code, 200)

        proof_res = self.client.get("/api/candidate/proof", headers=headers)
        self.assertEqual(proof_res.status_code, 200)

        rec_res = self.client.get("/api/candidate/recommendations", headers=headers)
        self.assertEqual(rec_res.status_code, 200)

    def test_recruiter_and_invitations(self):
        self._create_user("Recruiter One", "rec@example.com", "PassRecruiter123!", "recruiter")
        cand_user = self._create_user("Cand Three", "cand3@example.com", "PassCandidate123!", "candidate")

        rec_token, _ = self._login("rec@example.com", "PassRecruiter123!")
        cand_token, _ = self._login("cand3@example.com", "PassCandidate123!")

        rec_headers = {"Authorization": f"Bearer {rec_token}", "Content-Type": "application/json"}
        cand_headers = {"Authorization": f"Bearer {cand_token}", "Content-Type": "application/json"}

        # Recruiter lists candidates
        cand_list_res = self.client.get("/api/recruiter/candidates", headers=rec_headers)
        self.assertEqual(cand_list_res.status_code, 200)

        # Candidate cannot access recruiter list (RBAC check)
        cand_denied = self.client.get("/api/recruiter/candidates", headers=cand_headers)
        self.assertEqual(cand_denied.status_code, 403)

        # Recruiter sends invitation
        inv_payload = {
            "candidate_id": cand_user.id,
            "role": "Security Analyst",
            "message": "We would like to invite you for an interview.",
            "interview_type": "Technical Defense",
            "scheduled_at": "2026-10-01 10:00 UTC",
        }
        inv_res = self.client.post("/api/invitations", data=json.dumps(inv_payload), headers=rec_headers)
        self.assertEqual(inv_res.status_code, 201)
        inv_id = inv_res.get_json().get("id")

        # Candidate views invitations
        cand_invs = self.client.get("/api/invitations", headers=cand_headers)
        self.assertEqual(cand_invs.status_code, 200)
        self.assertEqual(len(cand_invs.get_json()), 1)

        # Candidate updates status (accepts)
        patch_res = self.client.patch(f"/api/invitations/{inv_id}", data=json.dumps({"status": "accepted"}), headers=cand_headers)
        self.assertEqual(patch_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
