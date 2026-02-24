from typing import List, Tuple
from src.ports.embedding import EmbeddingProviderPort
from src.utils.embeddings import get_embedding_with_fallback


class EmbeddingProviderAdapter(EmbeddingProviderPort):
    def get_embedding(self, content: str) -> Tuple[List[float], bool]:
        return get_embedding_with_fallback(content)
