from typing import Dict, List, Optional, Callable

from app.domain.ports.llm_port import LLMPort
from app.utils.openai_client import generate_chat_completion, generate_embedding


class OpenAIAdapter(LLMPort):
    """LLMPort implementation backed by OpenAI utilities."""

    def __init__(
        self,
        chat_completion_func: Callable[..., str] = generate_chat_completion,
        embedding_func: Callable[..., List[float]] = generate_embedding
    ) -> None:
        self._chat_completion = chat_completion_func
        self._embedding = embedding_func

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 4000
    ) -> str:
        return self._chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )

    def generate_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
        return self._embedding(text=text, model=model)
