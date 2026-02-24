"""
Unit tests for Gemini Client (app/utils/gemini_client.py)
"""

import pytest
from unittest.mock import patch, MagicMock
import requests

from app.utils.gemini_client import (
    generate_chat_completion_gemini,
    _convert_messages_to_gemini_format,
)


class TestConvertMessagesToGeminiFormat:
    """Tests for _convert_messages_to_gemini_format function"""

    def test_convert_user_message(self):
        """Should convert user message to Gemini format"""
        messages = [{"role": "user", "content": "Hello, world!"}]

        result = _convert_messages_to_gemini_format(messages)

        assert len(result) == 1
        assert result[0]["role"] == "user"
        assert result[0]["parts"][0]["text"] == "Hello, world!"

    def test_convert_assistant_message(self):
        """Should convert assistant to model role"""
        messages = [{"role": "assistant", "content": "I am an AI."}]

        result = _convert_messages_to_gemini_format(messages)

        assert len(result) == 1
        assert result[0]["role"] == "model"
        assert result[0]["parts"][0]["text"] == "I am an AI."

    def test_convert_system_message_prepends_to_user(self):
        """Should prepend system message to first user message"""
        messages = [
            {"role": "system", "content": "You are a legal assistant."},
            {"role": "user", "content": "Help me draft a document."}
        ]

        result = _convert_messages_to_gemini_format(messages)

        assert len(result) == 1  # System is merged, not separate
        assert result[0]["role"] == "user"
        assert "You are a legal assistant." in result[0]["parts"][0]["text"]
        assert "Help me draft a document." in result[0]["parts"][0]["text"]
        assert "---" in result[0]["parts"][0]["text"]  # Separator

    def test_convert_conversation(self):
        """Should convert full conversation"""
        messages = [
            {"role": "system", "content": "You are helpful."},
            {"role": "user", "content": "First question"},
            {"role": "assistant", "content": "First answer"},
            {"role": "user", "content": "Second question"}
        ]

        result = _convert_messages_to_gemini_format(messages)

        assert len(result) == 3  # system merged into first user
        assert result[0]["role"] == "user"
        assert result[1]["role"] == "model"
        assert result[2]["role"] == "user"

    def test_empty_messages(self):
        """Should handle empty messages list"""
        messages = []

        result = _convert_messages_to_gemini_format(messages)

        assert result == []

    def test_missing_content_uses_empty(self):
        """Should handle message without content"""
        messages = [{"role": "user"}]

        result = _convert_messages_to_gemini_format(messages)

        assert result[0]["parts"][0]["text"] == ""

    def test_missing_role_defaults_to_user(self):
        """Should default to user role when missing"""
        messages = [{"content": "Hello"}]

        result = _convert_messages_to_gemini_format(messages)

        assert result[0]["role"] == "user"


class TestGenerateChatCompletionGemini:
    """Tests for generate_chat_completion_gemini function"""

    @patch('app.utils.gemini_client.settings')
    def test_raises_error_without_api_key(self, mock_settings):
        """Should raise ValueError when API key is not configured"""
        mock_settings.GEMINI_API_KEY = None

        with pytest.raises(ValueError) as exc_info:
            generate_chat_completion_gemini([{"role": "user", "content": "Test"}])

        assert "GEMINI_API_KEY is not configured" in str(exc_info.value)

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_successful_response(self, mock_settings, mock_post):
        """Should return text from successful API response"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "Generated response"}]}}
            ],
            "usageMetadata": {
                "promptTokenCount": 10,
                "candidatesTokenCount": 20
            }
        }
        mock_post.return_value = mock_response

        result = generate_chat_completion_gemini(
            [{"role": "user", "content": "Test message"}]
        )

        assert result == "Generated response"

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_replaces_nbsp(self, mock_settings, mock_post):
        """Should replace &nbsp; with spaces"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "Hello&nbsp;World"}]}}
            ]
        }
        mock_post.return_value = mock_response

        result = generate_chat_completion_gemini(
            [{"role": "user", "content": "Test"}]
        )

        assert result == "Hello World"

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_handles_api_error_status(self, mock_settings, mock_post):
        """Should raise ValueError on non-200 status"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": {"message": "Invalid request"}
        }
        mock_post.return_value = mock_response

        with pytest.raises(ValueError) as exc_info:
            generate_chat_completion_gemini(
                [{"role": "user", "content": "Test"}]
            )

        assert "Invalid request" in str(exc_info.value)

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_handles_no_candidates(self, mock_settings, mock_post):
        """Should raise ValueError when no candidates returned"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"candidates": []}
        mock_post.return_value = mock_response

        with pytest.raises(ValueError) as exc_info:
            generate_chat_completion_gemini(
                [{"role": "user", "content": "Test"}]
            )

        assert "no candidates" in str(exc_info.value)

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_handles_empty_response(self, mock_settings, mock_post):
        """Should raise ValueError when response text is empty"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": ""}]}}]
        }
        mock_post.return_value = mock_response

        with pytest.raises(ValueError) as exc_info:
            generate_chat_completion_gemini(
                [{"role": "user", "content": "Test"}]
            )

        assert "empty response" in str(exc_info.value)

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_handles_timeout(self, mock_settings, mock_post):
        """Should raise on timeout"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_post.side_effect = requests.Timeout("Request timed out")

        with pytest.raises(requests.Timeout):
            generate_chat_completion_gemini(
                [{"role": "user", "content": "Test"}]
            )

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_handles_request_exception(self, mock_settings, mock_post):
        """Should raise on request exception"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_post.side_effect = requests.RequestException("Connection error")

        with pytest.raises(requests.RequestException):
            generate_chat_completion_gemini(
                [{"role": "user", "content": "Test"}]
            )

    @patch('app.utils.gemini_client.requests.post')
    @patch('app.utils.gemini_client.settings')
    def test_custom_parameters(self, mock_settings, mock_post):
        """Should use custom model and temperature"""
        mock_settings.GEMINI_API_KEY = "test-key"
        mock_settings.LLM_REQUEST_TIMEOUT_SECONDS = 30

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "Response"}]}}
            ]
        }
        mock_post.return_value = mock_response

        generate_chat_completion_gemini(
            [{"role": "user", "content": "Test"}],
            model="gemini-1.5-pro",
            temperature=0.7,
            max_tokens=8000
        )

        # Verify URL contains correct model
        call_args = mock_post.call_args
        assert "gemini-1.5-pro" in call_args[0][0]

        # Verify payload contains correct config
        payload = call_args[1]["json"]
        assert payload["generationConfig"]["temperature"] == 0.7
        assert payload["generationConfig"]["maxOutputTokens"] == 8000
