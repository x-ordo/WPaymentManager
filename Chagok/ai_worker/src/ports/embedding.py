from typing import Protocol, List, Tuple


class EmbeddingProviderPort(Protocol):
    def get_embedding(self, content: str) -> Tuple[List[float], bool]:
        ...
