# Deprecated Utilities

These modules are retained for backward compatibility and tests. Use the
hexagonal architecture ports/adapters instead.

- app.utils.openai_client -> app.domain.ports.llm_port + app.infrastructure.llm
- app.utils.qdrant -> app.domain.ports.vector_db_port + app.infrastructure.vector_db
- app.utils.dynamo -> app.domain.ports.metadata_store_port + app.infrastructure.metadata
- app.utils.s3 -> app.domain.ports.file_storage_port + app.infrastructure.storage
- app.utils.lambda_client -> app.domain.ports.worker_port + app.infrastructure.worker
- app.utils.audit -> app.adapters.audit_adapter
- app.utils.consistency -> app.adapters.consistency_adapter
