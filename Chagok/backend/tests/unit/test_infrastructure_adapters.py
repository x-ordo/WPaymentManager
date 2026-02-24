from unittest.mock import MagicMock

from app.infrastructure.llm.openai_adapter import OpenAIAdapter
from app.infrastructure.llm.gemini_adapter import GeminiAdapter
from app.infrastructure.vector_db.qdrant_adapter import QdrantAdapter
from app.infrastructure.metadata.dynamodb_adapter import DynamoDBAdapter
from app.infrastructure.storage.s3_adapter import S3Adapter
from app.infrastructure.worker.lambda_adapter import LambdaAdapter


def test_openai_adapter_delegates_calls():
    chat = MagicMock(return_value="ok")
    embed = MagicMock(return_value=[0.1])
    adapter = OpenAIAdapter(chat_completion_func=chat, embedding_func=embed)

    assert adapter.generate_chat_completion([{"role": "user", "content": "hi"}]) == "ok"
    assert adapter.generate_embedding("hello") == [0.1]

    chat.assert_called_once()
    embed.assert_called_once()


def test_gemini_adapter_delegates_calls():
    chat = MagicMock(return_value="ok")
    embed = MagicMock(return_value=[0.2])
    adapter = GeminiAdapter(chat_completion_func=chat, embedding_func=embed)

    assert adapter.generate_chat_completion([{"role": "user", "content": "hi"}]) == "ok"
    assert adapter.generate_embedding("hello") == [0.2]

    chat.assert_called_once()
    embed.assert_called_once()


def test_qdrant_adapter_delegates_calls():
    search_evidence = MagicMock(return_value=[{"id": "1"}])
    search_legal = MagicMock(return_value=[{"id": "2"}])
    get_template = MagicMock(return_value={"template_type": "이혼소장"})
    create_collection = MagicMock(return_value=True)

    adapter = QdrantAdapter(
        search_evidence_func=search_evidence,
        search_legal_func=search_legal,
        get_template_func=get_template,
        create_collection_func=create_collection
    )

    assert adapter.search_evidence("case", "query") == [{"id": "1"}]
    assert adapter.search_legal_knowledge("query") == [{"id": "2"}]
    assert adapter.get_template("이혼소장") == {"template_type": "이혼소장"}
    assert adapter.create_collection("case") is True

    search_evidence.assert_called_once()
    search_legal.assert_called_once()
    get_template.assert_called_once_with("이혼소장")
    create_collection.assert_called_once_with("case")


def test_dynamodb_adapter_delegates_calls():
    get_evidence = MagicMock(return_value=[{"id": "1"}])
    put_evidence = MagicMock(return_value={"id": "1"})
    get_summary = MagicMock(return_value={"case_id": "case"})
    put_summary = MagicMock(return_value={"case_id": "case"})
    update_summary = MagicMock(return_value=True)
    backup_regen = MagicMock(return_value={"case_id": "case"})

    adapter = DynamoDBAdapter(
        get_evidence_func=get_evidence,
        put_evidence_func=put_evidence,
        get_case_summary_func=get_summary,
        put_case_summary_func=put_summary,
        update_case_summary_func=update_summary,
        backup_regenerate_func=backup_regen
    )

    assert adapter.get_evidence_by_case("case") == [{"id": "1"}]
    assert adapter.put_evidence({"id": "1"}) == {"id": "1"}
    assert adapter.get_case_fact_summary("case") == {"case_id": "case"}
    assert adapter.put_case_fact_summary({"case_id": "case"}) == {"case_id": "case"}
    assert adapter.update_case_fact_summary("case", "summary", "user") is True
    assert adapter.backup_and_regenerate_fact_summary("case", {"case_id": "case"}) == {"case_id": "case"}

    get_evidence.assert_called_once_with("case")
    put_evidence.assert_called_once_with({"id": "1"})
    get_summary.assert_called_once_with("case")
    put_summary.assert_called_once_with({"case_id": "case"})
    update_summary.assert_called_once_with("case", "summary", "user")
    backup_regen.assert_called_once_with("case", {"case_id": "case"})


def test_s3_adapter_delegates_calls():
    upload = MagicMock(return_value={"upload_url": "u", "fields": {}})
    download = MagicMock(return_value="d")
    adapter = S3Adapter(upload_url_func=upload, download_url_func=download)

    assert adapter.generate_upload_url("bucket", "key", "text/plain") == {"upload_url": "u", "fields": {}}
    assert adapter.generate_download_url("bucket", "key") == "d"

    upload.assert_called_once_with(bucket="bucket", key="key", content_type="text/plain", expires_in=300)
    download.assert_called_once_with(bucket="bucket", key="key", expires_in=300)


def test_lambda_adapter_delegates_calls():
    invoke = MagicMock(return_value={"status": "ok"})
    adapter = LambdaAdapter(invoke_func=invoke)

    assert adapter.invoke("bucket", "key", "evidence", "case") == {"status": "ok"}
    invoke.assert_called_once_with(bucket="bucket", s3_key="key", evidence_id="evidence", case_id="case")
