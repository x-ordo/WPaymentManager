"""
Tests for Users API - PIPA (Personal Information Protection Act) Compliance
Testing GET /users/me/data, DELETE /users/me/data, GET /users/me/activity,
GET /users/me/deletion-status

PIPA Article 35: Personal data access rights
PIPA Article 36: Personal data deletion rights
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


class TestGetPersonalData:
    """
    Tests for GET /users/me/data endpoint (PIPA Article 35)
    """

    def test_should_return_personal_data_when_authenticated(
        self, client: TestClient, auth_headers, test_user
    ):
        """
        Given: Authenticated user
        When: GET /users/me/data
        Then: Returns 200 with all personal data
        """
        # When
        response = client.get("/api/users/me/data", headers=auth_headers)

        # Then
        assert response.status_code == 200
        data = response.json()

        # Verify user info
        assert "user" in data
        assert data["user"]["id"] == test_user.id
        assert data["user"]["email"] == test_user.email
        assert data["user"]["name"] == test_user.name

        # Verify structure
        assert "cases" in data
        assert "activity_log" in data
        assert "export_timestamp" in data
        assert "data_categories" in data

        # Verify data categories
        assert len(data["data_categories"]) > 0
        assert any("계정 정보" in cat for cat in data["data_categories"])

    def test_should_include_user_cases_in_export(
        self, client: TestClient, auth_headers, test_user, test_case
    ):
        """
        Given: User with associated cases
        When: GET /users/me/data
        Then: Returns cases in export
        """
        # When
        response = client.get("/api/users/me/data", headers=auth_headers)

        # Then
        assert response.status_code == 200
        data = response.json()

        # Check cases
        assert "cases" in data
        assert isinstance(data["cases"], list)
        # Should include test_case if user is member
        if len(data["cases"]) > 0:
            case = data["cases"][0]
            assert "id" in case
            assert "title" in case
            assert "status" in case
            assert "role" in case
            assert "created_at" in case

    def test_should_return_401_when_not_authenticated(
        self, client: TestClient
    ):
        """
        Given: No authentication
        When: GET /users/me/data
        Then: Returns 401
        """
        # When
        response = client.get("/api/users/me/data")

        # Then
        assert response.status_code == 401


class TestGetActivityLog:
    """
    Tests for GET /users/me/activity endpoint
    """

    def test_should_return_activity_log_when_authenticated(
        self, client: TestClient, auth_headers, test_user
    ):
        """
        Given: Authenticated user with activity
        When: GET /users/me/activity
        Then: Returns 200 with activity entries
        """
        # When
        response = client.get("/api/users/me/activity", headers=auth_headers)

        # Then
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # If there are entries, verify structure
        if len(data) > 0:
            entry = data[0]
            assert "id" in entry
            assert "action" in entry
            assert "timestamp" in entry

    def test_should_respect_days_parameter(
        self, client: TestClient, auth_headers
    ):
        """
        Given: Authenticated user
        When: GET /users/me/activity?days=7
        Then: Returns activity from last 7 days
        """
        # When
        response = client.get(
            "/api/users/me/activity?days=7",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200

    def test_should_respect_limit_parameter(
        self, client: TestClient, auth_headers
    ):
        """
        Given: Authenticated user
        When: GET /users/me/activity?limit=10
        Then: Returns at most 10 entries
        """
        # When
        response = client.get(
            "/api/users/me/activity?limit=10",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 10

    def test_should_return_401_when_not_authenticated(
        self, client: TestClient
    ):
        """
        Given: No authentication
        When: GET /users/me/activity
        Then: Returns 401
        """
        # When
        response = client.get("/api/users/me/activity")

        # Then
        assert response.status_code == 401


class TestRequestDataDeletion:
    """
    Tests for DELETE /users/me/data endpoint (PIPA Article 36)
    """

    def test_should_reject_without_confirmation(
        self, client: TestClient, auth_headers
    ):
        """
        Given: Authenticated user
        When: DELETE /users/me/data without confirm=True
        Then: Returns 400 validation error
        """
        # When
        response = client.request(
            "DELETE",
            "/api/users/me/data",
            headers=auth_headers,
            json={"confirm": False}
        )

        # Then
        assert response.status_code == 400
        data = response.json()
        # Check error message exists
        assert "detail" in data or "error" in data

    def test_should_accept_deletion_request_with_confirmation(
        self, client: TestClient, test_env
    ):
        """
        Given: Authenticated user with confirm=True
        When: DELETE /users/me/data
        Then: Returns 202 with deletion scheduled
        """
        # Create a separate user for this test (to avoid affecting other tests)
        from app.db.session import get_db
        from app.db.models import User
        from app.core.security import hash_password, create_access_token

        db = next(get_db())
        try:
            # Create test user
            deletion_test_user = User(
                email="deletion_test@example.com",
                hashed_password=hash_password("test_password123"),
                name="Deletion Test User",
                role="lawyer"
            )
            db.add(deletion_test_user)
            db.commit()
            db.refresh(deletion_test_user)

            # Create token
            token = create_access_token(
                data={"sub": deletion_test_user.id, "role": deletion_test_user.role}
            )
            headers = {"Authorization": f"Bearer {token}"}

            # When
            response = client.request(
                "DELETE",
                "/api/users/me/data",
                headers=headers,
                json={"confirm": True, "reason": "Test deletion"}
            )

            # Then
            assert response.status_code == 202
            data = response.json()

            assert "request_id" in data
            assert data["request_id"].startswith("del_")
            assert data["status"] == "SCHEDULED"
            assert "scheduled_deletion_date" in data
            assert "affected_data" in data
            assert len(data["affected_data"]) > 0

            # Verify scheduled date is ~30 days in future
            scheduled = datetime.fromisoformat(
                data["scheduled_deletion_date"].replace("Z", "+00:00")
            )
            now = datetime.utcnow()
            # Should be roughly 30 days (29-31 to account for timing)
            diff = (scheduled.replace(tzinfo=None) - now).days
            assert 29 <= diff <= 31

        finally:
            # Cleanup
            try:
                db.query(User).filter(
                    User.email == "deletion_test@example.com"
                ).delete()
                db.commit()
            except Exception:
                db.rollback()
            db.close()

    def test_should_return_401_when_not_authenticated(
        self, client: TestClient
    ):
        """
        Given: No authentication
        When: DELETE /users/me/data
        Then: Returns 401
        """
        # When
        response = client.request(
            "DELETE",
            "/api/users/me/data",
            json={"confirm": True}
        )

        # Then
        assert response.status_code == 401


class TestGetDeletionStatus:
    """
    Tests for GET /users/me/deletion-status endpoint
    """

    def test_should_return_404_when_no_deletion_request(
        self, client: TestClient, auth_headers
    ):
        """
        Given: User without deletion request
        When: GET /users/me/deletion-status
        Then: Returns 404
        """
        # When
        response = client.get(
            "/api/users/me/deletion-status",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 404

    def test_should_return_status_after_deletion_request(
        self, client: TestClient, test_env
    ):
        """
        Given: User with active deletion request
        When: GET /users/me/deletion-status
        Then: Returns 200 with status info
        """
        # Create user and request deletion first
        from app.db.session import get_db
        from app.db.models import User
        from app.core.security import hash_password, create_access_token

        db = next(get_db())
        try:
            # Create test user
            status_test_user = User(
                email="status_test@example.com",
                hashed_password=hash_password("test_password123"),
                name="Status Test User",
                role="lawyer"
            )
            db.add(status_test_user)
            db.commit()
            db.refresh(status_test_user)

            # Create token
            token = create_access_token(
                data={"sub": status_test_user.id, "role": status_test_user.role}
            )
            headers = {"Authorization": f"Bearer {token}"}

            # First, request deletion
            client.request(
                "DELETE",
                "/api/users/me/data",
                headers=headers,
                json={"confirm": True}
            )

            # When - check status
            response = client.get(
                "/api/users/me/deletion-status",
                headers=headers
            )

            # Then
            assert response.status_code == 200
            data = response.json()

            assert "request_id" in data
            assert data["status"] in ["SCHEDULED", "PENDING", "COMPLETED"]
            assert "scheduled_deletion_date" in data
            assert "affected_data" in data

        finally:
            # Cleanup
            try:
                db.query(User).filter(
                    User.email == "status_test@example.com"
                ).delete()
                db.commit()
            except Exception:
                db.rollback()
            db.close()

    def test_should_return_401_when_not_authenticated(
        self, client: TestClient
    ):
        """
        Given: No authentication
        When: GET /users/me/deletion-status
        Then: Returns 401
        """
        # When
        response = client.get("/api/users/me/deletion-status")

        # Then
        assert response.status_code == 401
