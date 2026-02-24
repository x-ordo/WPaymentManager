from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class LLMPort(ABC):
    """Port interface for LLM providers."""

    @abstractmethod
    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> str:
        """Generate a chat completion for the provided messages."""

    @abstractmethod
    def generate_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
        """Generate an embedding for the provided text."""
