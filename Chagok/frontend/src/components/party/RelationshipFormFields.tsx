import type {
  PartyNode,
  PartyRelationship,
  RelationshipType,
} from '@/types/party';
import { RELATIONSHIP_TYPE_LABELS } from '@/types/party';

export interface RelationshipFormData {
  source_party_id: string;
  target_party_id: string;
  type: RelationshipType;
  start_date: string;
  end_date: string;
  notes: string;
}

interface RelationshipFormFieldsProps {
  formData: RelationshipFormData;
  onFormChange: (changes: Partial<RelationshipFormData>) => void;
  parties: PartyNode[];
  isEditMode: boolean;
  relationship?: PartyRelationship | null;
  sourcePartySelectId: string;
  targetPartySelectId: string;
  startDateInputId: string;
  endDateInputId: string;
  notesTextareaId: string;
}

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'marriage',
  'affair',
  'parent_child',
  'sibling',
  'in_law',
  'cohabit',
];

function getPartyLabel(parties: PartyNode[], partyId: string) {
  const party = parties.find((p) => p.id === partyId);
  return party ? party.name : partyId;
}

export function RelationshipFormFields({
  formData,
  onFormChange,
  parties,
  isEditMode,
  relationship,
  sourcePartySelectId,
  targetPartySelectId,
  startDateInputId,
  endDateInputId,
  notesTextareaId,
}: RelationshipFormFieldsProps) {
  return (
    <>
      {!isEditMode && (
        <>
          <div>
            <label htmlFor={sourcePartySelectId} className="block text-sm font-medium text-gray-700 mb-1">
              출발 당사자 <span className="text-red-500">*</span>
            </label>
            <select
              id={sourcePartySelectId}
              value={formData.source_party_id}
              onChange={(e) => onFormChange({ source_party_id: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
            >
              <option value="">선택해주세요</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name} ({party.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={targetPartySelectId} className="block text-sm font-medium text-gray-700 mb-1">
              도착 당사자 <span className="text-red-500">*</span>
            </label>
            <select
              id={targetPartySelectId}
              value={formData.target_party_id}
              onChange={(e) => onFormChange({ target_party_id: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
            >
              <option value="">선택해주세요</option>
              {parties
                .filter((p) => p.id !== formData.source_party_id)
                .map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name} ({party.type})
                  </option>
                ))}
            </select>
          </div>
        </>
      )}

      {isEditMode && relationship && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{getPartyLabel(parties, relationship.source_party_id)}</span>
            {' → '}
            <span className="font-medium">{getPartyLabel(parties, relationship.target_party_id)}</span>
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          관계 유형 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {RELATIONSHIP_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onFormChange({ type })}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-colors
                ${formData.type === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {RELATIONSHIP_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={startDateInputId} className="block text-sm font-medium text-gray-700 mb-1">
            시작일
          </label>
          <input
            id={startDateInputId}
            type="date"
            value={formData.start_date}
            onChange={(e) => onFormChange({ start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={endDateInputId} className="block text-sm font-medium text-gray-700 mb-1">
            종료일
          </label>
          <input
            id={endDateInputId}
            type="date"
            value={formData.end_date}
            onChange={(e) => onFormChange({ end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor={notesTextareaId} className="block text-sm font-medium text-gray-700 mb-1">
          메모
        </label>
        <textarea
          id={notesTextareaId}
          value={formData.notes}
          onChange={(e) => onFormChange({ notes: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:border-neutral-600 dark:text-white resize-none"
          rows={3}
          placeholder="관계에 대한 추가 설명"
        />
      </div>
    </>
  );
}

export default RelationshipFormFields;
