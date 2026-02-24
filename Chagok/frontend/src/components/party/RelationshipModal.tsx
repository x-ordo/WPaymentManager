/**
 * RelationshipModal - Modal for adding/editing party relationships
 * User Story 1: Party Relationship Graph
 */

'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import type {
  PartyNode,
  PartyRelationship,
  RelationshipCreate,
  RelationshipUpdate,
} from '@/types/party';
import { RelationshipFormFields, RelationshipFormData } from '@/components/party/RelationshipFormFields';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RelationshipCreate | RelationshipUpdate) => Promise<void>;
  onDelete?: () => Promise<void>;
  relationship?: PartyRelationship | null;
  parties: PartyNode[];
  // Pre-selected parties for new relationship (from drag)
  sourcePartyId?: string;
  targetPartyId?: string;
}

export function RelationshipModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  relationship,
  parties,
  sourcePartyId,
  targetPartyId,
}: RelationshipModalProps) {
  const isEditMode = !!relationship;
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const sourcePartySelectId = useId();
  const targetPartySelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();
  const notesTextareaId = useId();

  const [formData, setFormData] = useState<RelationshipFormData>({
    source_party_id: '',
    target_party_id: '',
    type: 'marriage',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleFormChange = useCallback(
    (changes: Partial<RelationshipFormData>) => {
      setFormData((prev) => ({ ...prev, ...changes }));
    },
    []
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (relationship) {
        setFormData({
          source_party_id: relationship.source_party_id,
          target_party_id: relationship.target_party_id,
          type: relationship.type,
          start_date: relationship.start_date?.split('T')[0] || '',
          end_date: relationship.end_date?.split('T')[0] || '',
          notes: relationship.notes || '',
        });
      } else {
        setFormData({
          source_party_id: sourcePartyId || '',
          target_party_id: targetPartyId || '',
          type: 'marriage',
          start_date: '',
          end_date: '',
          notes: '',
        });
      }
      setError(null);
    }
  }, [isOpen, relationship, sourcePartyId, targetPartyId]);

  useFocusTrap({ isActive: isOpen, containerRef: modalRef, onEscape: onClose });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.source_party_id || !formData.target_party_id) {
      setError('당사자를 선택해주세요.');
      return;
    }
    if (formData.source_party_id === formData.target_party_id) {
      setError('같은 당사자를 선택할 수 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const updateData: RelationshipUpdate = {
          type: formData.type,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(updateData);
      } else {
        const createData: RelationshipCreate = {
          source_party_id: formData.source_party_id,
          target_party_id: formData.target_party_id,
          type: formData.type,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (!window.confirm('이 관계를 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {isEditMode ? '관계 수정' : '관계 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <RelationshipFormFields
              formData={formData}
              onFormChange={handleFormChange}
              parties={parties}
              isEditMode={isEditMode}
              relationship={relationship}
              sourcePartySelectId={sourcePartySelectId}
              targetPartySelectId={targetPartySelectId}
              startDateInputId={startDateInputId}
              endDateInputId={endDateInputId}
              notesTextareaId={notesTextareaId}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between px-6 py-4 border-t bg-gray-50 rounded-b-lg">
            <div>
              {isEditMode && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={isSubmitting || isDeleting}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
