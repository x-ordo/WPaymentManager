import inspect

from app.domain.ports.llm_port import LLMPort
from app.domain.ports.vector_db_port import VectorDBPort
from app.domain.ports.metadata_store_port import MetadataStorePort
from app.domain.ports.file_storage_port import FileStoragePort
from app.domain.ports.worker_port import WorkerPort


def test_llm_port_is_abstract():
    assert inspect.isabstract(LLMPort)


def test_vector_db_port_is_abstract():
    assert inspect.isabstract(VectorDBPort)


def test_metadata_store_port_is_abstract():
    assert inspect.isabstract(MetadataStorePort)


def test_file_storage_port_is_abstract():
    assert inspect.isabstract(FileStoragePort)


def test_worker_port_is_abstract():
    assert inspect.isabstract(WorkerPort)
