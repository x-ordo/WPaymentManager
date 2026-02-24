"""
Unit tests for DynamoDB utilities (app/utils/dynamo.py)
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from botocore.exceptions import ClientError

from app.utils.dynamo import (
    _serialize_value,
    _deserialize_value,
    _serialize_to_dynamodb,
    _deserialize_dynamodb_item,
    get_evidence_by_case,
    get_evidence_by_id,
    put_evidence_metadata,
    update_evidence_status,
    delete_evidence_metadata,
    clear_case_evidence,
    get_case_fact_summary,
    put_case_fact_summary,
    update_case_fact_summary,
    backup_and_regenerate_fact_summary,
    update_evidence_speaker_mapping,
    get_evidence_speaker_mapping,
)


class TestSerializeValue:
    """Tests for _serialize_value function"""

    def test_serialize_none(self):
        """Should serialize None to NULL type"""
        result = _serialize_value(None)
        assert result == {'NULL': True}

    def test_serialize_bool_true(self):
        """Should serialize True to BOOL type"""
        result = _serialize_value(True)
        assert result == {'BOOL': True}

    def test_serialize_bool_false(self):
        """Should serialize False to BOOL type"""
        result = _serialize_value(False)
        assert result == {'BOOL': False}

    def test_serialize_string(self):
        """Should serialize string to S type"""
        result = _serialize_value("hello")
        assert result == {'S': "hello"}

    def test_serialize_int(self):
        """Should serialize int to N type"""
        result = _serialize_value(42)
        assert result == {'N': '42'}

    def test_serialize_float(self):
        """Should serialize float to N type"""
        result = _serialize_value(3.14)
        assert result == {'N': '3.14'}

    def test_serialize_empty_list(self):
        """Should serialize empty list to L type"""
        result = _serialize_value([])
        assert result == {'L': []}

    def test_serialize_list(self):
        """Should serialize list to L type with nested values"""
        result = _serialize_value(["a", "b"])
        assert result == {'L': [{'S': 'a'}, {'S': 'b'}]}

    def test_serialize_dict(self):
        """Should serialize dict to M type"""
        result = _serialize_value({"key": "value"})
        assert result == {'M': {'key': {'S': 'value'}}}

    def test_serialize_other_type(self):
        """Should serialize other types as string"""
        result = _serialize_value(object())
        assert 'S' in result


class TestDeserializeValue:
    """Tests for _deserialize_value function"""

    def test_deserialize_null(self):
        """Should deserialize NULL to None"""
        result = _deserialize_value({'NULL': True})
        assert result is None

    def test_deserialize_bool(self):
        """Should deserialize BOOL to bool"""
        result = _deserialize_value({'BOOL': True})
        assert result is True

    def test_deserialize_string(self):
        """Should deserialize S to string"""
        result = _deserialize_value({'S': 'hello'})
        assert result == 'hello'

    def test_deserialize_int(self):
        """Should deserialize N to int"""
        result = _deserialize_value({'N': '42'})
        assert result == 42
        assert isinstance(result, int)

    def test_deserialize_float(self):
        """Should deserialize N with decimal to float"""
        result = _deserialize_value({'N': '3.14'})
        assert result == 3.14
        assert isinstance(result, float)

    def test_deserialize_list(self):
        """Should deserialize L to list"""
        result = _deserialize_value({'L': [{'S': 'a'}, {'S': 'b'}]})
        assert result == ['a', 'b']

    def test_deserialize_map(self):
        """Should deserialize M to dict"""
        result = _deserialize_value({'M': {'key': {'S': 'value'}}})
        assert result == {'key': 'value'}

    def test_deserialize_string_set(self):
        """Should deserialize SS to list"""
        result = _deserialize_value({'SS': ['a', 'b', 'c']})
        assert result == ['a', 'b', 'c']

    def test_deserialize_number_set_ints(self):
        """Should deserialize NS to list of ints"""
        result = _deserialize_value({'NS': ['1', '2', '3']})
        assert result == [1, 2, 3]

    def test_deserialize_number_set_floats(self):
        """Should deserialize NS with decimals to list of floats"""
        result = _deserialize_value({'NS': ['1.5', '2.5']})
        assert result == [1.5, 2.5]

    def test_deserialize_unknown(self):
        """Should return None for unknown type"""
        result = _deserialize_value({'UNKNOWN': 'value'})
        assert result is None


class TestSerializeDeserializeItem:
    """Tests for item-level serialization/deserialization"""

    def test_serialize_to_dynamodb(self):
        """Should serialize entire dict to DynamoDB format"""
        data = {'name': 'test', 'count': 5, 'active': True}
        result = _serialize_to_dynamodb(data)

        assert result == {
            'name': {'S': 'test'},
            'count': {'N': '5'},
            'active': {'BOOL': True}
        }

    def test_deserialize_dynamodb_item(self):
        """Should deserialize DynamoDB item to dict"""
        item = {
            'name': {'S': 'test'},
            'count': {'N': '5'},
            'active': {'BOOL': True}
        }
        result = _deserialize_dynamodb_item(item)

        assert result == {'name': 'test', 'count': 5, 'active': True}


class TestGetEvidenceByCase:
    """Tests for get_evidence_by_case function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_evidence_list(self, mock_get_client):
        """Should return list of evidence for case"""
        mock_client = MagicMock()
        mock_client.query.return_value = {
            'Items': [
                {
                    'evidence_id': {'S': 'ev_001'},
                    'case_id': {'S': 'case_001'},
                    'type': {'S': 'image'},
                    'created_at': {'S': '2024-01-15T10:00:00Z'}
                },
                {
                    'evidence_id': {'S': 'ev_002'},
                    'case_id': {'S': 'case_001'},
                    'type': {'S': 'audio'},
                    'created_at': {'S': '2024-01-14T10:00:00Z'}
                }
            ]
        }
        mock_get_client.return_value = mock_client

        result = get_evidence_by_case('case_001')

        assert len(result) == 2
        assert result[0]['evidence_id'] == 'ev_001'  # Sorted by created_at desc
        mock_client.query.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_empty_list_when_no_evidence(self, mock_get_client):
        """Should return empty list when no evidence found"""
        mock_client = MagicMock()
        mock_client.query.return_value = {'Items': []}
        mock_get_client.return_value = mock_client

        result = get_evidence_by_case('case_999')

        assert result == []

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_client_error(self, mock_get_client):
        """Should raise ClientError on DynamoDB error"""
        mock_client = MagicMock()
        mock_client.query.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Error'}},
            'Query'
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(ClientError):
            get_evidence_by_case('case_001')


class TestGetEvidenceById:
    """Tests for get_evidence_by_id function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_evidence(self, mock_get_client):
        """Should return evidence dict when found"""
        mock_client = MagicMock()
        mock_client.get_item.return_value = {
            'Item': {
                'evidence_id': {'S': 'ev_001'},
                'case_id': {'S': 'case_001'},
                'type': {'S': 'image'}
            }
        }
        mock_get_client.return_value = mock_client

        result = get_evidence_by_id('ev_001')

        assert result['evidence_id'] == 'ev_001'
        assert result['type'] == 'image'

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_none_when_not_found(self, mock_get_client):
        """Should return None when evidence not found"""
        mock_client = MagicMock()
        mock_client.get_item.return_value = {}
        mock_get_client.return_value = mock_client

        result = get_evidence_by_id('ev_999')

        assert result is None

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_client_error(self, mock_get_client):
        """Should raise ClientError on DynamoDB error"""
        mock_client = MagicMock()
        mock_client.get_item.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Table not found'}},
            'GetItem'
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(ClientError):
            get_evidence_by_id('ev_001')


class TestPutEvidenceMetadata:
    """Tests for put_evidence_metadata function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_puts_evidence_with_evidence_id(self, mock_get_client):
        """Should put evidence with evidence_id field"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        data = {'evidence_id': 'ev_001', 'case_id': 'case_001', 'type': 'image'}
        result = put_evidence_metadata(data)

        assert result['evidence_id'] == 'ev_001'
        mock_client.put_item.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_puts_evidence_with_id_field(self, mock_get_client):
        """Should put evidence using id field as evidence_id"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        data = {'id': 'ev_002', 'case_id': 'case_001', 'type': 'audio'}
        result = put_evidence_metadata(data)

        assert result['evidence_id'] == 'ev_002'

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_adds_created_at_if_missing(self, mock_get_client):
        """Should add created_at timestamp if not present"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        data = {'evidence_id': 'ev_001', 'case_id': 'case_001'}
        result = put_evidence_metadata(data)

        assert 'created_at' in result

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_without_id(self, mock_get_client):
        """Should raise ValueError when no id/evidence_id"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        with pytest.raises(ValueError) as exc_info:
            put_evidence_metadata({'case_id': 'case_001'})

        assert "evidence_id" in str(exc_info.value)

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_client_error(self, mock_get_client):
        """Should raise ClientError on DynamoDB error"""
        mock_client = MagicMock()
        mock_client.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Error'}},
            'PutItem'
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(ClientError):
            put_evidence_metadata({'evidence_id': 'ev_001', 'case_id': 'case_001'})


class TestUpdateEvidenceStatus:
    """Tests for update_evidence_status function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_updates_status(self, mock_get_client):
        """Should update evidence status"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = update_evidence_status('ev_001', 'completed')

        assert result is True
        mock_client.update_item.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_updates_with_error_message(self, mock_get_client):
        """Should include error_message when provided"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = update_evidence_status('ev_001', 'failed', 'Processing error')

        assert result is True
        call_args = mock_client.update_item.call_args
        assert ':error_message' in call_args[1]['ExpressionAttributeValues']

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_updates_with_additional_fields(self, mock_get_client):
        """Should include additional fields when provided"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = update_evidence_status(
            'ev_001',
            'completed',
            additional_fields={'ai_summary': 'Test summary'}
        )

        assert result is True

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on ClientError"""
        mock_client = MagicMock()
        mock_client.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException', 'Message': 'Error'}},
            'UpdateItem'
        )
        mock_get_client.return_value = mock_client

        result = update_evidence_status('ev_001', 'completed')

        assert result is False


class TestDeleteEvidenceMetadata:
    """Tests for delete_evidence_metadata function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_deletes_evidence(self, mock_get_client):
        """Should delete evidence successfully"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = delete_evidence_metadata('ev_001')

        assert result is True
        mock_client.delete_item.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on ClientError"""
        mock_client = MagicMock()
        mock_client.delete_item.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Error'}},
            'DeleteItem'
        )
        mock_get_client.return_value = mock_client

        result = delete_evidence_metadata('ev_001')

        assert result is False


class TestClearCaseEvidence:
    """Tests for clear_case_evidence function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_clears_all_case_evidence(self, mock_get_client):
        """Should delete all evidence for a case"""
        mock_client = MagicMock()
        mock_client.query.return_value = {
            'Items': [
                {'evidence_id': {'S': 'ev_001'}},
                {'evidence_id': {'S': 'ev_002'}},
            ]
        }
        mock_get_client.return_value = mock_client

        result = clear_case_evidence('case_001')

        assert result == 2
        assert mock_client.delete_item.call_count == 2

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_zero_when_no_evidence(self, mock_get_client):
        """Should return 0 when no evidence to delete"""
        mock_client = MagicMock()
        mock_client.query.return_value = {'Items': []}
        mock_get_client.return_value = mock_client

        result = clear_case_evidence('case_empty')

        assert result == 0

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_handles_individual_delete_failures(self, mock_get_client):
        """Should continue deleting even if some fail"""
        mock_client = MagicMock()
        mock_client.query.return_value = {
            'Items': [
                {'evidence_id': {'S': 'ev_001'}},
                {'evidence_id': {'S': 'ev_002'}},
            ]
        }
        # First delete succeeds, second fails
        mock_client.delete_item.side_effect = [
            None,
            ClientError(
                {'Error': {'Code': 'InternalError', 'Message': 'Error'}},
                'DeleteItem'
            )
        ]
        mock_get_client.return_value = mock_client

        result = clear_case_evidence('case_001')

        assert result == 1  # Only first delete counted

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_query_error(self, mock_get_client):
        """Should raise ClientError on query failure"""
        mock_client = MagicMock()
        mock_client.query.side_effect = ClientError(
            {'Error': {'Code': 'AccessDeniedException', 'Message': 'Access denied'}},
            'Query'
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(ClientError):
            clear_case_evidence('case_001')


class TestGetCaseFactSummary:
    """Tests for get_case_fact_summary function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_summary(self, mock_get_client):
        """Should return fact summary when found"""
        mock_client = MagicMock()
        mock_client.get_item.return_value = {
            'Item': {
                'case_id': {'S': 'case_001'},
                'ai_summary': {'S': 'Test summary'},
                'created_at': {'S': '2024-01-15T10:00:00Z'}
            }
        }
        mock_get_client.return_value = mock_client

        result = get_case_fact_summary('case_001')

        assert result['case_id'] == 'case_001'
        assert result['ai_summary'] == 'Test summary'

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_none_when_not_found(self, mock_get_client):
        """Should return None when summary not found"""
        mock_client = MagicMock()
        mock_client.get_item.return_value = {}
        mock_get_client.return_value = mock_client

        result = get_case_fact_summary('case_999')

        assert result is None

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_client_error(self, mock_get_client):
        """Should raise ClientError on DynamoDB error"""
        mock_client = MagicMock()
        mock_client.get_item.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Table not found'}},
            'GetItem'
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(ClientError):
            get_case_fact_summary('case_001')


class TestPutCaseFactSummary:
    """Tests for put_case_fact_summary function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_puts_summary(self, mock_get_client):
        """Should put fact summary"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        data = {'case_id': 'case_001', 'ai_summary': 'Test summary'}
        result = put_case_fact_summary(data)

        assert result['case_id'] == 'case_001'
        assert 'created_at' in result
        mock_client.put_item.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_without_case_id(self, mock_get_client):
        """Should raise ValueError when no case_id"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        with pytest.raises(ValueError) as exc_info:
            put_case_fact_summary({'ai_summary': 'Test'})

        assert "case_id" in str(exc_info.value)

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_client_error(self, mock_get_client):
        """Should raise ClientError on DynamoDB error"""
        mock_client = MagicMock()
        mock_client.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Error'}},
            'PutItem'
        )
        mock_get_client.return_value = mock_client

        with pytest.raises(ClientError):
            put_case_fact_summary({'case_id': 'case_001', 'ai_summary': 'Test'})


class TestUpdateCaseFactSummary:
    """Tests for update_case_fact_summary function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_updates_summary(self, mock_get_client):
        """Should update modified summary"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = update_case_fact_summary(
            'case_001',
            'Modified summary',
            'user_001'
        )

        assert result is True
        mock_client.update_item.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on ClientError"""
        mock_client = MagicMock()
        mock_client.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException', 'Message': 'Error'}},
            'UpdateItem'
        )
        mock_get_client.return_value = mock_client

        result = update_case_fact_summary('case_001', 'Modified', 'user_001')

        assert result is False


class TestBackupAndRegenerateFactSummary:
    """Tests for backup_and_regenerate_fact_summary function"""

    @patch('app.utils.dynamo.get_case_fact_summary')
    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_regenerates_with_backup(self, mock_get_client, mock_get_summary):
        """Should backup current and store new summary"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_get_summary.return_value = {
            'case_id': 'case_001',
            'modified_summary': 'Old modified summary'
        }

        new_data = {'ai_summary': 'New AI summary'}
        result = backup_and_regenerate_fact_summary('case_001', new_data)

        assert result['case_id'] == 'case_001'
        assert result['previous_version'] == 'Old modified summary'
        assert result['modified_summary'] is None
        mock_client.put_item.assert_called_once()

    @patch('app.utils.dynamo.get_case_fact_summary')
    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_regenerates_without_previous(self, mock_get_client, mock_get_summary):
        """Should regenerate without backup when no previous summary"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_get_summary.return_value = None

        new_data = {'ai_summary': 'New AI summary'}
        result = backup_and_regenerate_fact_summary('case_001', new_data)

        assert result['case_id'] == 'case_001'
        assert 'previous_version' not in result

    @patch('app.utils.dynamo.get_case_fact_summary')
    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_raises_on_client_error(self, mock_get_client, mock_get_summary):
        """Should raise ClientError on DynamoDB error"""
        mock_client = MagicMock()
        mock_client.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Error'}},
            'PutItem'
        )
        mock_get_client.return_value = mock_client
        mock_get_summary.return_value = None

        with pytest.raises(ClientError):
            backup_and_regenerate_fact_summary('case_001', {'ai_summary': 'Test'})


class TestUpdateEvidenceSpeakerMapping:
    """Tests for update_evidence_speaker_mapping function"""

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_updates_speaker_mapping(self, mock_get_client):
        """Should update speaker mapping"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mapping = {'나': 'party_001', '상대방': 'party_002'}
        result = update_evidence_speaker_mapping('ev_001', mapping, 'user_001')

        assert result is True
        mock_client.update_item.assert_called_once()

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_clears_mapping_with_none(self, mock_get_client):
        """Should clear mapping when None provided"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = update_evidence_speaker_mapping('ev_001', None, 'user_001')

        assert result is True
        # Should use REMOVE for clearing
        call_args = mock_client.update_item.call_args
        assert 'REMOVE' in call_args[1]['UpdateExpression']

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_clears_mapping_with_empty_dict(self, mock_get_client):
        """Should clear mapping when empty dict provided"""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        result = update_evidence_speaker_mapping('ev_001', {}, 'user_001')

        assert result is True

    @patch('app.utils.dynamo._get_dynamodb_client')
    def test_returns_false_on_error(self, mock_get_client):
        """Should return False on ClientError"""
        mock_client = MagicMock()
        mock_client.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Error'}},
            'UpdateItem'
        )
        mock_get_client.return_value = mock_client

        result = update_evidence_speaker_mapping('ev_001', {'나': 'party_001'}, 'user_001')

        assert result is False


class TestGetEvidenceSpeakerMapping:
    """Tests for get_evidence_speaker_mapping function"""

    @patch('app.utils.dynamo.get_evidence_by_id')
    def test_returns_mapping(self, mock_get_evidence):
        """Should return speaker mapping from evidence"""
        mock_get_evidence.return_value = {
            'evidence_id': 'ev_001',
            'speaker_mapping': {'나': 'party_001', '상대방': 'party_002'}
        }

        result = get_evidence_speaker_mapping('ev_001')

        assert result == {'나': 'party_001', '상대방': 'party_002'}

    @patch('app.utils.dynamo.get_evidence_by_id')
    def test_returns_none_when_evidence_not_found(self, mock_get_evidence):
        """Should return None when evidence not found"""
        mock_get_evidence.return_value = None

        result = get_evidence_speaker_mapping('ev_999')

        assert result is None

    @patch('app.utils.dynamo.get_evidence_by_id')
    def test_returns_none_when_no_mapping(self, mock_get_evidence):
        """Should return None when evidence has no mapping"""
        mock_get_evidence.return_value = {'evidence_id': 'ev_001', 'type': 'image'}

        result = get_evidence_speaker_mapping('ev_001')

        assert result is None
