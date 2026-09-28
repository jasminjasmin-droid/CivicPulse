"""
Comprehensive Test Suite for Features 15, 16, and 17.
Verifies all Admin APIs, Analytics APIs, Citizen Frontend API flows,
security rules, and database integrity.
"""

import io
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from app.database import SessionLocal
from app.models import Complaint, ComplaintHistory, Department, ComplaintEvidence, Notification, User
from app.security import create_access_token, hash_password

BASE_URL = "http://127.0.0.1:8000"


def make_request(
    endpoint: str,
    method: str = "GET",
    data: dict | None = None,
    token: str | None = None,
    files: dict | None = None,
) -> tuple[int, dict | list]:
    url = f"{BASE_URL}{endpoint}"
    headers = {}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if files:
        boundary = "----WebKitFormBoundaryCivicPulseTest2026"
        body = io.BytesIO()
        for field_name, (filename, file_content, content_type) in files.items():
            body.write(f"--{boundary}\r\n".encode())
            body.write(
                f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode()
            )
            body.write(f"Content-Type: {content_type}\r\n\r\n".encode())
            body.write(file_content)
            body.write(b"\r\n")
        body.write(f"--{boundary}--\r\n".encode())
        payload = body.getvalue()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    elif data is not None:
        payload = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    else:
        payload = None

    req = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"raw": content}


def run_all_tests():
    print("=" * 70)
    print("CIVICPULSE: FEATURES 15, 16, 17 VERIFICATION SUITE")
    print("=" * 70)

    db = SessionLocal()

    # Capture initial database state
    initial_user_count = db.query(User).count()
    initial_complaint_count = db.query(Complaint).count()
    initial_dept_count = db.query(Department).count()
    print(f"Initial DB State: {initial_user_count} users, {initial_complaint_count} complaints, {initial_dept_count} departments.")

    # Create dedicated temporary admin user for testing
    admin_email = "test_admin_suite@civicpulse.gov.in"
    db_admin = db.query(User).filter(User.email == admin_email).first()
    if not db_admin:
        db_admin = User(
            name="Suite Administrator",
            email=admin_email,
            password=hash_password("AdminSecurePassword123!"),
            role="admin",
        )
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)
    admin_id = db_admin.id
    admin_token = create_access_token({"sub": str(admin_id), "email": admin_email, "role": "admin"})

    # Setup Authority User token
    auth_user = db.query(User).filter(User.email == "officer@civicpulse.gov.in").first()
    assert auth_user is not None, "Officer user must exist"
    auth_token = create_access_token({"sub": str(auth_user.id), "email": auth_user.email, "role": "authority"})

    # Existing Citizen token (Jasmin)
    citizen_user = db.query(User).filter(User.email == "jasmin@test.com").first()
    assert citizen_user is not None, "Jasmin citizen must exist"
    citizen_token = create_access_token({"sub": str(citizen_user.id), "email": citizen_user.email, "role": "citizen"})

    db.close()

    try:
        # ========================================================
        # FEATURE 15: ADMIN ROLE & ADMIN APIS
        # ========================================================
        print("\n--- [Feature 15] Admin RBAC & APIs ---")

        # 1. Admin RBAC guard
        s, _ = make_request("/admin/dashboard")
        assert s == 401, f"Expected 401 for unauthenticated /admin/dashboard, got {s}"
        s, _ = make_request("/admin/dashboard", token=citizen_token)
        assert s == 403, f"Expected 403 for citizen /admin/dashboard, got {s}"
        s, _ = make_request("/admin/dashboard", token=auth_token)
        assert s == 403, f"Expected 403 for authority /admin/dashboard, got {s}"
        s, b = make_request("/admin/dashboard", token=admin_token)
        assert s == 200 and "total_admins" in b and "total_users" in b, f"Admin dashboard failed: {b}"
        print("[PASS] 1. Admin RBAC & Dashboard (/admin/dashboard)")

        # 2. Public registration cannot create admin
        s, b = make_request("/users", method="POST", data={
            "name": "Hacker Admin",
            "email": "hacker_admin@test.com",
            "password": "Password123!",
            "role": "admin",
        })
        assert s == 400, f"Expected 400 when registering with role='admin', got {s}"
        print("[PASS] 2. Public Registration rejects admin role (400)")

        # 3. Admin Users API & Password safety
        s, users = make_request("/admin/users", token=admin_token)
        assert s == 200 and isinstance(users, list), f"Failed to list admin users: {users}"
        for u in users:
            assert "password" not in u, "CRITICAL: password exposed in /admin/users response!"
            assert "password_hash" not in u, "CRITICAL: password_hash exposed in /admin/users!"
        print("[PASS] 3. Admin Users (/admin/users) - password hashes NEVER exposed")

        # 4. Admin Role Modification & Safety Guard
        # Attempt demoting sole admin
        s, b = make_request(f"/admin/users/{admin_id}/role", method="PATCH", data={"role": "citizen"}, token=admin_token)
        assert s == 400, "Safety guard failed: should not allow demoting last admin"
        # Promote and demote user 3
        s, b = make_request("/admin/users/3/role", method="PATCH", data={"role": "authority"}, token=admin_token)
        assert s == 200 and b["role"] == "authority", f"Failed to update role: {b}"
        s, b = make_request("/admin/users/3/role", method="PATCH", data={"role": "citizen"}, token=admin_token)
        assert s == 200 and b["role"] == "citizen", f"Failed to revert role: {b}"
        print("[PASS] 4. Admin User Role Management & Last-Admin Demotion Guard")

        # 5. Admin Complaints & Departments
        s, comps = make_request("/admin/complaints", token=admin_token)
        assert s == 200 and isinstance(comps, list), f"Admin complaints failed: {comps}"
        s, depts = make_request("/admin/departments", token=admin_token)
        assert s == 200 and isinstance(depts, list), f"Admin departments failed: {depts}"
        print("[PASS] 5. Admin Complaints & Departments (/admin/complaints, /admin/departments)")

        # ========================================================
        # FEATURE 16: PLATFORM ANALYTICS & REPORTS
        # ========================================================
        print("\n--- [Feature 16] Analytics & Reports ---")

        # 6. Analytics access control
        s, _ = make_request("/analytics/overview")
        assert s == 401, f"Expected 401 for unauth analytics, got {s}"
        s, _ = make_request("/analytics/overview", token=citizen_token)
        assert s == 403, f"Expected 403 for citizen analytics, got {s}"
        s, ov = make_request("/analytics/overview", token=auth_token)
        assert s == 200 and "resolution_rate" in ov, f"Authority analytics failed: {ov}"
        s, ov_admin = make_request("/analytics/overview", token=admin_token)
        assert s == 200 and "resolution_rate" in ov_admin, f"Admin analytics failed: {ov_admin}"
        print("[PASS] 6. Analytics RBAC & Overview (/analytics/overview)")

        # 7. Category, Department, Status, Priority breakdowns
        s, cats = make_request("/analytics/categories", token=auth_token)
        assert s == 200 and len(cats) > 0, "Categories breakdown failed"
        s, depts_stat = make_request("/analytics/departments", token=auth_token)
        assert s == 200 and len(depts_stat) > 0, "Departments breakdown failed"
        s, statuses = make_request("/analytics/status", token=auth_token)
        assert s == 200 and len(statuses) > 0, "Status breakdown failed"
        s, priorities = make_request("/analytics/priority", token=auth_token)
        assert s == 200 and len(priorities) > 0, "Priority breakdown failed"
        print("[PASS] 7. Analytics Breakdowns (categories, departments, status, priority)")

        # 8. Trends with date range filtering
        s, trends = make_request("/analytics/trends", token=auth_token)
        assert s == 200 and isinstance(trends, list), "Trends failed"
        s, trends_filtered = make_request("/analytics/trends?start_date=2026-09-28&end_date=2026-09-28", token=auth_token)
        assert s == 200, "Trends with date range failed"
        s, _ = make_request("/analytics/trends?start_date=not-a-date", token=auth_token)
        assert s == 400, "Trends with invalid date should return 400"
        print("[PASS] 8. Analytics Trends with date range & error handling (/analytics/trends)")

        # ========================================================
        # FEATURE 17: CITIZEN FRONTEND FLOWS & REGRESSION
        # ========================================================
        print("\n--- [Feature 17] Citizen Frontend APIs & Flows ---")

        # 9. Register Citizen
        test_citizen_email = "citizen_frontend_test@civicpulse.org"
        s, reg_res = make_request("/users", method="POST", data={
            "name": "Frontend Test Citizen",
            "email": test_citizen_email,
            "password": "CitizenSecretPassword123!",
            "role": "citizen",
        })
        assert s in (200, 201), f"Citizen registration failed: {reg_res}"
        test_citizen_id = reg_res["id"]
        print("[PASS] 9. Citizen Registration (POST /users)")

        # 10. Login
        # Test bad credentials
        s, _ = make_request("/login", method="POST", data={
            "email": test_citizen_email,
            "password": "wrong_password",
        })
        assert s == 401, "Expected 401 for incorrect password"
        # Test correct login
        s, login_data = make_request("/login", method="POST", data={
            "email": test_citizen_email,
            "password": "CitizenSecretPassword123!",
        })
        assert s == 200 and "access_token" in login_data, f"Login failed: {login_data}"
        new_citizen_token = login_data["access_token"]
        print("[PASS] 10. Citizen Login (POST /login)")

        # 11. Profile (GET /me)
        s, me_data = make_request("/me", token=new_citizen_token)
        assert s == 200 and me_data["email"] == test_citizen_email and me_data["role"] == "citizen"
        print("[PASS] 11. Profile retrieval (GET /me)")

        # 12. Citizen Dashboard (GET /dashboard)
        s, dash_stats = make_request("/dashboard", token=new_citizen_token)
        assert s == 200 and dash_stats["total"] == 0, f"Expected 0 complaints for new citizen, got {dash_stats}"
        print("[PASS] 12. Citizen Dashboard stats (GET /dashboard)")

        # 13. Create Complaint (POST /complaints)
        s, new_comp = make_request("/complaints", method="POST", token=new_citizen_token, data={
            "title": "Broken Streetlight on Elm Street",
            "description": "Streetlight pole #42 is flickering dangerously near school zone.",
            "category": "Street Lighting",
            "priority": "High",
            "address": "42 Elm Street, Ward 10",
            "latitude": 13.0827,
            "longitude": 80.2707,
        })
        assert s == 201 and new_comp["status"] == "Pending", f"Create complaint failed: {new_comp}"
        new_comp_id = new_comp["id"]
        print(f"[PASS] 13. Create Complaint (POST /complaints) -> ID #{new_comp_id}")

        # Verify dashboard now reflects 1 total, 1 pending
        s, dash_stats2 = make_request("/dashboard", token=new_citizen_token)
        assert dash_stats2["total"] == 1 and dash_stats2["pending"] == 1
        print("[PASS] 13b. Dashboard reactively updated after complaint creation")

        # 14. List Complaints with Search & Filters (GET /complaints)
        s, comp_list = make_request("/complaints", token=new_citizen_token)
        assert s == 200 and len(comp_list) == 1
        # Search test
        s, search_match = make_request("/complaints?search=Elm", token=new_citizen_token)
        assert s == 200 and len(search_match) == 1
        s, search_nomatch = make_request("/complaints?search=NonExistent12345", token=new_citizen_token)
        assert s == 200 and len(search_nomatch) == 0
        # Category filter test
        s, cat_match = make_request("/complaints?category=Street+Lighting", token=new_citizen_token)
        assert s == 200 and len(cat_match) == 1
        s, cat_nomatch = make_request("/complaints?category=Water+Supply", token=new_citizen_token)
        assert s == 200 and len(cat_nomatch) == 0
        # Priority filter test
        s, prio_match = make_request("/complaints?priority=High", token=new_citizen_token)
        assert s == 200 and len(prio_match) == 1
        # Status filter test
        s, status_match = make_request("/complaints?status=Pending", token=new_citizen_token)
        assert s == 200 and len(status_match) == 1
        print("[PASS] 14. Complaints Listing with Search, Status, Category, Priority filters")

        # 15. Complaint Detail (GET /complaints/{id})
        s, comp_detail = make_request(f"/complaints/{new_comp_id}", token=new_citizen_token)
        assert s == 200 and comp_detail["id"] == new_comp_id
        # Other citizen cannot access (404 for isolation)
        s, _ = make_request(f"/complaints/{new_comp_id}", token=citizen_token)
        assert s == 404, "Data isolation failed: Citizen B accessed Citizen A's complaint"
        print("[PASS] 15. Complaint Details & Multi-Tenant Data Isolation")

        # 16. Complaint Timeline / History (GET /complaints/{id}/history)
        s, history = make_request(f"/complaints/{new_comp_id}/history", token=new_citizen_token)
        assert s == 200 and len(history) >= 1
        assert history[0]["action"] == "Created"
        print("[PASS] 16. Complaint Timeline & History (GET /complaints/{id}/history)")

        # 17. Evidence Upload & Retrieval (POST & GET /complaints/{id}/evidence)
        dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        s, ev_res = make_request(
            f"/complaints/{new_comp_id}/evidence",
            method="POST",
            token=new_citizen_token,
            files={"file": ("streetlight_evidence.png", dummy_png, "image/png")},
        )
        assert s == 201 and ev_res["file_name"] == "streetlight_evidence.png", f"Upload failed: {ev_res}"
        ev_id = ev_res["id"]

        # View evidence list
        s, ev_list = make_request(f"/complaints/{new_comp_id}/evidence", token=new_citizen_token)
        assert s == 200 and len(ev_list) == 1 and ev_list[0]["id"] == ev_id
        print(f"[PASS] 17. Evidence Upload and Listing (POST & GET /complaints/{new_comp_id}/evidence)")

        # 18. Notifications Flow
        # Authority updates complaint status to "In Progress" -> triggers notification to citizen
        s, update_res = make_request(
            f"/complaints/{new_comp_id}/status",
            method="PATCH",
            token=auth_token,
            data={"status": "In Progress"},
        )
        assert s == 200 and update_res["status"] == "In Progress"

        # Check unread notifications count
        s, unread_res = make_request("/notifications/unread-count", token=new_citizen_token)
        assert s == 200 and unread_res["unread_count"] >= 1, f"Expected notification, got {unread_res}"

        # List notifications
        s, notifs = make_request("/notifications", token=new_citizen_token)
        assert s == 200 and len(notifs) >= 1
        notif_id = notifs[0]["id"]

        # Mark single notification as read
        s, read_res = make_request(f"/notifications/{notif_id}/read", method="PATCH", token=new_citizen_token)
        assert s == 200 and read_res["is_read"] is True

        # Mark all notifications as read
        s, read_all_res = make_request("/notifications/read-all", method="PATCH", token=new_citizen_token)
        assert s == 200 and "message" in read_all_res
        print("[PASS] 18. Notifications End-to-End (List, Unread Count, Read Single, Read All)")

        # 19. Clean up temporary test citizen and test complaint
        db = SessionLocal()
        db.query(ComplaintEvidence).filter(ComplaintEvidence.complaint_id == new_comp_id).delete()
        db.query(Notification).filter(Notification.user_id == test_citizen_id).delete()
        db.query(ComplaintHistory).filter(ComplaintHistory.complaint_id == new_comp_id).delete()
        db.query(Complaint).filter(Complaint.id == new_comp_id).delete()
        db.query(User).filter(User.id == test_citizen_id).delete()
        db.commit()
        db.close()
        print("[PASS] 19. Automated cleanup of test citizen grievance data")

        # 20. Database Integrity Verification
        db = SessionLocal()
        final_user_count = db.query(User).count()
        final_complaint_count = db.query(Complaint).count()
        final_dept_count = db.query(Department).count()
        db.close()

        # Admin user is still present until finally block
        assert final_user_count == initial_user_count + 1, f"Users changed: expected {initial_user_count+1}, got {final_user_count}"
        assert final_complaint_count == initial_complaint_count, f"Complaints changed: expected {initial_complaint_count}, got {final_complaint_count}"
        assert final_dept_count == initial_dept_count, f"Departments changed: expected {initial_dept_count}, got {final_dept_count}"
        print(f"[PASS] 20. Database Integrity Confirmed: All original {initial_complaint_count} complaints, {initial_dept_count} departments, and original users fully preserved!")

        print("\n" + "=" * 70)
        print("ALL TESTS PASSED SUCCESSFULLY! (Features 15, 16, 17 Verified)")
        print("=" * 70)

    finally:
        db = SessionLocal()
        db.query(User).filter(User.id == admin_id).delete()
        db.commit()
        db.close()
        print("Test suite cleanup: Temporary test admin removed.")


if __name__ == "__main__":
    run_all_tests()
