from typing import Any, Optional
from src.ports.storage import VectorStorePort
from src.storage.vector_store import VectorStore


class VectorStoreAdapter(VectorStorePort):
    def __init__(self, store: Optional[VectorStore] = None):
        self._store = store or VectorStore()

    def add_chunk_with_metadata(self, **kwargs: Any) -> None:
        self._store.add_chunk_with_metadata(**kwargs)
