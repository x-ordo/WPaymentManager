"""
Unit tests for Code Tracking utilities (app/utils/code_tracking.py)
"""

import pytest
from datetime import datetime, timezone

from app.utils.code_tracking import (
    CodeFingerprint,
    UsageTracker,
    get_fingerprint,
    get_tracker,
    get_tracking_headers,
    verify_deployment,
)


class TestCodeFingerprint:
    """Tests for CodeFingerprint class"""

    def test_get_build_fingerprint_returns_string(self):
        """Should return 32-char hex string"""
        fp = CodeFingerprint()
        result = fp.get_build_fingerprint()

        assert isinstance(result, str)
        assert len(result) == 32
        # Should be hex characters
        assert all(c in '0123456789abcdef' for c in result)

    def test_get_build_fingerprint_is_cached(self):
        """Should return same fingerprint on multiple calls"""
        fp = CodeFingerprint()
        result1 = fp.get_build_fingerprint()
        result2 = fp.get_build_fingerprint()

        assert result1 == result2

    def test_get_environment_fingerprint_returns_string(self):
        """Should return 32-char hex string"""
        fp = CodeFingerprint()
        result = fp.get_environment_fingerprint()

        assert isinstance(result, str)
        assert len(result) == 32

    def test_get_instance_fingerprint_returns_string(self):
        """Should return 32-char hex string"""
        fp = CodeFingerprint()
        result = fp.get_instance_fingerprint()

        assert isinstance(result, str)
        assert len(result) == 32

    def test_different_instances_have_different_fingerprints(self):
        """Should generate different instance fingerprints"""
        fp1 = CodeFingerprint()
        fp2 = CodeFingerprint()

        # Instance fingerprints should be different
        assert fp1.get_instance_fingerprint() != fp2.get_instance_fingerprint()
        # But build fingerprints are the same
        assert fp1.get_build_fingerprint() == fp2.get_build_fingerprint()

    def test_sign_data(self):
        """Should sign data with HMAC"""
        result = CodeFingerprint.sign_data("test data")

        assert isinstance(result, str)
        assert len(result) == 64  # SHA256 produces 64 hex chars

    def test_verify_signature_valid(self):
        """Should verify valid signature"""
        data = "test data"
        signature = CodeFingerprint.sign_data(data)

        assert CodeFingerprint.verify_signature(data, signature) is True

    def test_verify_signature_invalid(self):
        """Should reject invalid signature"""
        data = "test data"
        invalid_signature = "a" * 64

        assert CodeFingerprint.verify_signature(data, invalid_signature) is False

    def test_generate_tracking_token(self):
        """Should generate tracking token with signature"""
        fp = CodeFingerprint()
        result = fp.generate_tracking_token()

        assert "token" in result
        assert "signature" in result
        assert "build_fp" in result["token"]
        assert "env_fp" in result["token"]
        assert "instance_fp" in result["token"]
        assert "timestamp" in result["token"]
        assert "watermark" in result["token"]

    def test_get_license_info(self):
        """Should return license information"""
        fp = CodeFingerprint()
        result = fp.get_license_info()

        assert "product" in result
        assert result["product"] == "Legal Evidence Hub"
        assert "version" in result
        assert "build_id" in result
        assert "build_fingerprint" in result
        assert "copyright" in result
        assert "license_type" in result
        assert result["tracking_enabled"] is True


class TestUsageTracker:
    """Tests for UsageTracker class"""

    def test_log_access(self):
        """Should log API access event"""
        fp = CodeFingerprint()
        tracker = UsageTracker(fp)

        result = tracker.log_access(
            endpoint="/api/cases",
            method="GET",
            user_id="user_001",
            client_ip="192.168.1.1",
            user_agent="Mozilla/5.0"
        )

        assert "timestamp" in result
        assert result["endpoint"] == "/api/cases"
        assert result["method"] == "GET"
        assert result["user_id"] == "user_001"
        assert "client_ip" in result  # Hashed IP
        assert "user_agent_hash" in result

    def test_log_access_without_optional_fields(self):
        """Should log access without optional fields"""
        fp = CodeFingerprint()
        tracker = UsageTracker(fp)

        result = tracker.log_access(
            endpoint="/api/health",
            method="GET"
        )

        assert result["endpoint"] == "/api/health"
        assert result["user_id"] is None
        assert result["client_ip"] is None
        assert result["user_agent_hash"] is None

    def test_get_usage_summary_empty(self):
        """Should return empty summary when no events"""
        fp = CodeFingerprint()
        tracker = UsageTracker(fp)

        result = tracker.get_usage_summary()

        assert result["total_events"] == 0
        assert result["endpoints"] == {}

    def test_get_usage_summary_with_events(self):
        """Should return summary of logged events"""
        fp = CodeFingerprint()
        tracker = UsageTracker(fp)

        tracker.log_access("/api/cases", "GET")
        tracker.log_access("/api/cases", "GET")
        tracker.log_access("/api/users", "POST")

        result = tracker.get_usage_summary()

        assert result["total_events"] == 3
        assert result["endpoints"]["/api/cases"] == 2
        assert result["endpoints"]["/api/users"] == 1
        assert "first_event" in result
        assert "last_event" in result

    def test_export_logs(self):
        """Should export copy of usage logs"""
        fp = CodeFingerprint()
        tracker = UsageTracker(fp)

        tracker.log_access("/api/test", "GET")

        logs = tracker.export_logs()

        assert len(logs) == 1
        assert logs[0]["endpoint"] == "/api/test"

    def test_log_circular_buffer(self):
        """Should maintain max log size"""
        fp = CodeFingerprint()
        tracker = UsageTracker(fp)
        tracker._max_log_size = 3  # Set small size for testing

        tracker.log_access("/api/1", "GET")
        tracker.log_access("/api/2", "GET")
        tracker.log_access("/api/3", "GET")
        tracker.log_access("/api/4", "GET")

        logs = tracker.export_logs()

        assert len(logs) == 3
        # Should have the last 3 entries
        assert logs[0]["endpoint"] == "/api/2"
        assert logs[2]["endpoint"] == "/api/4"

    def test_hash_ip(self):
        """Should hash IP addresses"""
        result = UsageTracker._hash_ip("192.168.1.1")

        assert isinstance(result, str)
        assert len(result) == 16
        # Same IP should produce same hash
        assert UsageTracker._hash_ip("192.168.1.1") == result
        # Different IP should produce different hash
        assert UsageTracker._hash_ip("10.0.0.1") != result

    def test_hash_user_agent(self):
        """Should hash user agent strings"""
        result = UsageTracker._hash_ua("Mozilla/5.0")

        assert isinstance(result, str)
        assert len(result) == 16


class TestGlobalFunctions:
    """Tests for global functions"""

    def test_get_fingerprint(self):
        """Should return global fingerprint instance"""
        fp = get_fingerprint()

        assert isinstance(fp, CodeFingerprint)

    def test_get_tracker(self):
        """Should return global tracker instance"""
        tracker = get_tracker()

        assert isinstance(tracker, UsageTracker)

    def test_get_tracking_headers(self):
        """Should return tracking headers dict"""
        headers = get_tracking_headers()

        assert "X-LEH-Build" in headers
        assert "X-LEH-Instance" in headers
        assert "X-LEH-Copyright" in headers
        assert len(headers["X-LEH-Build"]) == 32
        assert len(headers["X-LEH-Instance"]) == 16

    def test_verify_deployment(self):
        """Should return deployment verification info"""
        result = verify_deployment()

        assert result["status"] == "active"
        assert "license_info" in result
        assert "verification_time" in result
        assert "tracking_token" in result
