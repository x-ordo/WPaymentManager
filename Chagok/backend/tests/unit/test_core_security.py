"""
Unit tests for app/core/security.py

Tests for JWT token creation and verification functions.
"""

import pytest
from datetime import timedelta
from unittest.mock import patch

from app.core.security import create_access_token, verify_password, hash_password


class TestCreateAccessToken:
    """Tests for create_access_token function"""

    def test_create_token_with_default_expiry(self):
        """Should create token with default expiry when expires_delta not provided"""
        data = {"sub": "user_123", "role": "lawyer"}

        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0
        # JWT format: header.payload.signature
        assert token.count('.') == 2

    def test_create_token_with_custom_expiry(self):
        """Should create token with custom expiry when expires_delta provided (line 65)"""
        data = {"sub": "user_456", "role": "staff"}
        custom_delta = timedelta(hours=2)

        token = create_access_token(data, expires_delta=custom_delta)

        assert isinstance(token, str)
        assert len(token) > 0
        assert token.count('.') == 2

    def test_create_token_with_short_expiry(self):
        """Should create token with very short expiry"""
        data = {"sub": "test_user"}
        short_delta = timedelta(minutes=5)

        token = create_access_token(data, expires_delta=short_delta)

        assert isinstance(token, str)
        assert len(token) > 0


class TestPasswordHashing:
    """Tests for password hashing functions"""

    def test_hash_password_returns_different_hash(self):
        """Should return hashed password different from original"""
        password = "test_password_123"

        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_success(self):
        """Should verify correct password"""
        password = "correct_password"
        hashed = hash_password(password)

        result = verify_password(password, hashed)

        assert result is True

    def test_verify_password_failure(self):
        """Should reject incorrect password"""
        password = "correct_password"
        hashed = hash_password(password)

        result = verify_password("wrong_password", hashed)

        assert result is False
