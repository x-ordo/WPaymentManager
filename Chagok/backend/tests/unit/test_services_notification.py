"""
Unit tests for Notification Service (app/services/notification_service.py)
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.db.models import NotificationType
from app.services.notification_service import NotificationService


class MockNotification:
    """Mock notification object for testing"""
    def __init__(self, **kwargs):
        self.id = kwargs.get("id", "notif_001")
        self.user_id = kwargs.get("user_id", "user_001")
        self.title = kwargs.get("title", "Test Title")
        self.content = kwargs.get("content", "Test Content")
        # Schema uses 'type' field, not 'notification_type'
        self.type = kwargs.get("type", NotificationType.SYSTEM)
        self.is_read = kwargs.get("is_read", False)
        self.related_id = kwargs.get("related_id", None)
        self.created_at = kwargs.get("created_at", datetime.utcnow())


class TestNotificationServiceCreate:
    """Tests for create_notification method"""

    def test_create_notification_success(self):
        """Should create notification with all fields"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        mock_notif = MockNotification(
            id="notif_001",
            user_id="user_001",
            title="New Case",
            content="Case updated",
            type=NotificationType.CASE_UPDATE
        )
        service.repository.create = MagicMock(return_value=mock_notif)

        result = service.create_notification(
            user_id="user_001",
            title="New Case",
            content="Case updated",
            notification_type=NotificationType.CASE_UPDATE
        )

        assert result.id == "notif_001"
        assert result.title == "New Case"
        service.repository.create.assert_called_once()

    def test_create_notification_with_related_id(self):
        """Should create notification with related_id"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        mock_notif = MockNotification(
            id="notif_002",
            user_id="user_001",
            title="Evidence Uploaded",
            content="New evidence uploaded",
            type=NotificationType.EVIDENCE,
            related_id="case_123"
        )
        service.repository.create = MagicMock(return_value=mock_notif)

        result = service.create_notification(
            user_id="user_001",
            title="Evidence Uploaded",
            content="New evidence uploaded",
            related_id="case_123"
        )

        assert result.related_id == "case_123"

    def test_create_notification_default_type(self):
        """Should use SYSTEM as default notification type"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        mock_notif = MockNotification(type=NotificationType.SYSTEM)
        service.repository.create = MagicMock(return_value=mock_notif)

        service.create_notification(
            user_id="user_001",
            title="Test",
            content="Test content"
        )

        call_args = service.repository.create.call_args
        assert call_args.kwargs["notification_type"] == NotificationType.SYSTEM


class TestNotificationServiceGet:
    """Tests for get_notifications method"""

    def test_get_notifications_success(self):
        """Should get notifications for user"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        mock_notifs = [
            MockNotification(id="notif_001", title="First"),
            MockNotification(id="notif_002", title="Second")
        ]
        service.repository.get_by_user = MagicMock(return_value=mock_notifs)
        service.repository.get_unread_count = MagicMock(return_value=2)

        result = service.get_notifications(user_id="user_001")

        assert len(result.notifications) == 2
        assert result.unread_count == 2

    def test_get_notifications_with_limit(self):
        """Should respect limit parameter"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.get_by_user = MagicMock(return_value=[])
        service.repository.get_unread_count = MagicMock(return_value=0)

        service.get_notifications(user_id="user_001", limit=5)

        call_args = service.repository.get_by_user.call_args
        assert call_args.kwargs["limit"] == 5

    def test_get_notifications_unread_only(self):
        """Should filter to unread only when requested"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.get_by_user = MagicMock(return_value=[])
        service.repository.get_unread_count = MagicMock(return_value=0)

        service.get_notifications(user_id="user_001", unread_only=True)

        call_args = service.repository.get_by_user.call_args
        assert call_args.kwargs["unread_only"] is True


class TestNotificationServiceMarkAsRead:
    """Tests for mark_as_read method"""

    def test_mark_as_read_success(self):
        """Should mark notification as read"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        mock_notif = MockNotification(id="notif_001", user_id="user_001", is_read=False)
        mock_updated = MockNotification(id="notif_001", user_id="user_001", is_read=True)

        service.repository.get_by_id = MagicMock(return_value=mock_notif)
        service.repository.mark_as_read = MagicMock(return_value=mock_updated)

        result = service.mark_as_read(notification_id="notif_001", user_id="user_001")

        assert result.is_read is True
        service.repository.mark_as_read.assert_called_once_with("notif_001")

    def test_mark_as_read_not_found(self):
        """Should raise KeyError when notification not found"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.get_by_id = MagicMock(return_value=None)

        with pytest.raises(KeyError):
            service.mark_as_read(notification_id="notif_999", user_id="user_001")

    def test_mark_as_read_wrong_user(self):
        """Should raise PermissionError when user doesn't own notification"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        mock_notif = MockNotification(id="notif_001", user_id="user_002")
        service.repository.get_by_id = MagicMock(return_value=mock_notif)

        with pytest.raises(PermissionError):
            service.mark_as_read(notification_id="notif_001", user_id="user_001")


class TestNotificationServiceMarkAllAsRead:
    """Tests for mark_all_as_read method"""

    def test_mark_all_as_read_success(self):
        """Should mark all notifications as read"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.mark_all_as_read = MagicMock(return_value=5)

        result = service.mark_all_as_read(user_id="user_001")

        assert result.updated_count == 5
        service.repository.mark_all_as_read.assert_called_once_with("user_001")

    def test_mark_all_as_read_no_notifications(self):
        """Should return 0 when no notifications to mark"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.mark_all_as_read = MagicMock(return_value=0)

        result = service.mark_all_as_read(user_id="user_001")

        assert result.updated_count == 0


class TestNotificationServiceGetUnreadCount:
    """Tests for get_unread_count method"""

    def test_get_unread_count_success(self):
        """Should return unread count"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.get_unread_count = MagicMock(return_value=10)

        result = service.get_unread_count(user_id="user_001")

        assert result == 10

    def test_get_unread_count_zero(self):
        """Should return 0 when no unread notifications"""
        mock_db = MagicMock()
        service = NotificationService(mock_db)

        service.repository.get_unread_count = MagicMock(return_value=0)

        result = service.get_unread_count(user_id="user_001")

        assert result == 0
