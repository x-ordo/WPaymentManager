/**
 * Detective Investigation Detail Client Component
 * 003-role-based-ui Feature - US5 (T103)
 *
 * Client component for case detail page.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getDetectiveCaseDetail,
  acceptCase,
  rejectCase,
  createFieldRecord,
  requestRecordPhotoUpload,
  uploadPhoto,
  submitReport,
  type CaseDetailData,
  type FieldRecord,
} from '@/lib/api/detective-portal';
import { useCaseIdFromUrl } from '@/hooks/useCaseIdFromUrl';
// Phase C.3: Shared status config
import { getCaseStatusConfig } from '@/lib/utils/statusConfig';
import { Modal, Button, Input } from '@/components/primitives';

interface DetectiveCaseDetailClientProps {
  caseId: string;
}

export default function DetectiveCaseDetailClient({ caseId: paramCaseId }: DetectiveCaseDetailClientProps) {
  const maxRecordPhotoSizeMb = 20;
  const maxRecordPhotoSizeBytes = maxRecordPhotoSizeMb * 1024 * 1024;

  // Use URL path for case ID (handles static export fallback)
  const caseId = useCaseIdFromUrl(paramCaseId);
  const router = useRouter();

  const [caseDetail, setCaseDetail] = useState<CaseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordType, setRecordType] = useState<FieldRecord['record_type']>('observation');
  const [recordContent, setRecordContent] = useState('');
  const [recordPhotoFile, setRecordPhotoFile] = useState<File | null>(null);
  const [recordPhotoProgress, setRecordPhotoProgress] = useState<number | null>(null);
  const [recordPhotoInputKey, setRecordPhotoInputKey] = useState(0);
  const [recordGpsLat, setRecordGpsLat] = useState('');
  const [recordGpsLng, setRecordGpsLng] = useState('');
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    summary: '',
    findings: '',
    conclusion: '',
    attachments: '',
  });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fetchCaseDetail = useCallback(
    async (showSpinner: boolean = true) => {
      if (showSpinner) {
        setLoading(true);
      }
      setError(null);

      const { data, error: apiError } = await getDetectiveCaseDetail(caseId);

      if (apiError) {
        setError(apiError);
      } else if (data) {
        setCaseDetail(data);
      }

      if (showSpinner) {
        setLoading(false);
      }
    },
    [caseId]
  );

  useEffect(() => {
    if (caseId) {
      fetchCaseDetail();
    }
  }, [caseId, fetchCaseDetail]);

  const handleAccept = async () => {
    setActionLoading(true);
    const { data, error: apiError } = await acceptCase(caseId);

    if (apiError) {
      setError(apiError);
    } else if (data?.success) {
      setCaseDetail((prev) =>
        prev ? { ...prev, status: data.new_status } : null
      );
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setActionLoading(true);
    const { data, error: apiError } = await rejectCase(caseId, rejectReason);

    if (apiError) {
      setError(apiError);
    } else if (data?.success) {
      router.push('/detective/cases');
    }
    setActionLoading(false);
    setShowRejectModal(false);
  };

  const resetRecordForm = () => {
    setRecordType('observation');
    setRecordContent('');
    setRecordPhotoFile(null);
    setRecordPhotoProgress(null);
    setRecordPhotoInputKey((prev) => prev + 1);
    setRecordGpsLat('');
    setRecordGpsLng('');
  };

  const resetReportForm = () => {
    setReportForm({
      summary: '',
      findings: '',
      conclusion: '',
      attachments: '',
    });
  };

  const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const numberValue = Number(trimmed);
    return Number.isNaN(numberValue) ? undefined : numberValue;
  };

  const handleCreateRecord = async () => {
    if (!recordContent.trim()) {
      setError('기록 내용을 입력해 주세요.');
      return;
    }

    if (recordType === 'photo' && !recordPhotoFile) {
      setError('사진 파일을 선택해 주세요.');
      return;
    }

    setRecordSubmitting(true);
    setError(null);

    let uploadedPhotoKey: string | undefined;

    if (recordType === 'photo' && recordPhotoFile) {
      setRecordPhotoProgress(0);
      const { data: uploadData, error: uploadError } = await requestRecordPhotoUpload(caseId, {
        file_name: recordPhotoFile.name,
        content_type: recordPhotoFile.type || 'application/octet-stream',
        file_size: recordPhotoFile.size,
      });

      if (uploadError || !uploadData) {
        setError(uploadError || '사진 업로드 URL 요청에 실패했습니다.');
        setRecordSubmitting(false);
        return;
      }

      const uploadResult = await uploadPhoto(
        uploadData.upload_url,
        recordPhotoFile,
        (percent) => setRecordPhotoProgress(percent)
      );

      if (!uploadResult.success) {
        setError(uploadResult.error || '사진 업로드에 실패했습니다.');
        setRecordSubmitting(false);
        return;
      }

      uploadedPhotoKey = uploadData.s3_key;
    }

    const payload = {
      record_type: recordType,
      content: recordContent.trim(),
    } as const;

    const gpsLat = parseOptionalNumber(recordGpsLat);
    const gpsLng = parseOptionalNumber(recordGpsLng);

    const { error: apiError } = await createFieldRecord(caseId, {
      ...payload,
      ...(gpsLat !== undefined ? { gps_lat: gpsLat } : {}),
      ...(gpsLng !== undefined ? { gps_lng: gpsLng } : {}),
      ...(uploadedPhotoKey ? { photo_key: uploadedPhotoKey } : {}),
    });

    if (apiError) {
      setError(apiError);
      setRecordSubmitting(false);
      return;
    }

    await fetchCaseDetail(false);
    setRecordSubmitting(false);
    setShowRecordModal(false);
    resetRecordForm();
  };

  const handleSubmitReport = async () => {
    if (!reportForm.summary.trim() || !reportForm.findings.trim() || !reportForm.conclusion.trim()) {
      setError('보고서 내용을 모두 입력해 주세요.');
      return;
    }

    setReportSubmitting(true);
    setError(null);

    const attachments = reportForm.attachments
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    const { data, error: apiError } = await submitReport(caseId, {
      summary: reportForm.summary.trim(),
      findings: reportForm.findings.trim(),
      conclusion: reportForm.conclusion.trim(),
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    if (apiError) {
      setError(apiError);
      setReportSubmitting(false);
      return;
    }

    if (data?.case_status) {
      setCaseDetail((prev) =>
        prev ? { ...prev, status: data.case_status } : prev
      );
    }

    await fetchCaseDetail(false);
    setReportSubmitting(false);
    setShowReportModal(false);
    resetReportForm();
  };

  const handleCloseRecordModal = () => {
    setShowRecordModal(false);
    resetRecordForm();
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    resetReportForm();
  };

  // Phase C.3: Using shared status config
  const getStatusBadge = (status: string) => {
    const config = getCaseStatusConfig(status);
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getRecordTypeLabel = (type: FieldRecord['record_type']) => {
    const labels: Record<string, string> = {
      observation: '관찰 기록',
      photo: '사진',
      note: '메모',
      video: '영상',
      audio: '음성',
    };
    return labels[type] || type;
  };

  const recordTypeOptions: FieldRecord['record_type'][] = [
    'observation',
    'photo',
    'note',
    'video',
    'audio',
  ];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (size: number) => {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${Math.round(size / 1024)}KB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-50 text-[var(--color-error)] rounded-lg">
          {error}
        </div>
        <Link
          href="/detective/cases"
          className="text-[var(--color-primary)] hover:underline"
        >
          &larr; 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        사건을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Link href="/detective/cases" className="hover:text-[var(--color-primary)]">
          의뢰 관리
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">{caseDetail.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-[var(--color-border)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {caseDetail.title}
              </h1>
              {getStatusBadge(caseDetail.status)}
            </div>
            <p className="text-[var(--color-text-secondary)]">
              {caseDetail.description || '설명 없음'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {caseDetail.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg
                    hover:bg-[var(--color-primary-hover)] disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading ? '처리중...' : '수락'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-[var(--color-error)] text-[var(--color-error)] rounded-lg
                    hover:bg-red-50 disabled:opacity-50 min-h-[44px]"
                >
                  거절
                </button>
              </>
            )}
            {caseDetail.status === 'active' && (
              <button
                type="button"
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg
                  hover:bg-[var(--color-primary-hover)] min-h-[44px] flex items-center gap-2"
                onClick={() => {
                  resetRecordForm();
                  setShowRecordModal(true);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                증거 업로드
              </button>
            )}
          </div>
        </div>

        {/* Case Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--color-border)]">
          <div>
            <span className="text-sm text-[var(--color-text-secondary)]">담당 변호사</span>
            <p className="font-medium">{caseDetail.lawyer_name || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-[var(--color-text-secondary)]">연락처</span>
            <p className="font-medium">{caseDetail.lawyer_email || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-[var(--color-text-secondary)]">생성일</span>
            <p className="font-medium">{formatDate(caseDetail.created_at)}</p>
          </div>
          <div>
            <span className="text-sm text-[var(--color-text-secondary)]">최근 수정</span>
            <p className="font-medium">{formatDate(caseDetail.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Records Section */}
      <div className="bg-white rounded-lg border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">증거 목록</h2>
          <span className="text-sm text-[var(--color-text-secondary)]">
            총 {caseDetail.records.length}건
          </span>
        </div>

        {caseDetail.records.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {caseDetail.records.map((record) => (
              <div key={record.id} className="p-4 hover:bg-[var(--color-bg-secondary)]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-bg-secondary)] rounded">
                        {getRecordTypeLabel(record.record_type)}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {formatDate(record.created_at)}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-primary)]">{record.content}</p>
                  </div>
                  {record.photo_url && (
                    <img
                      src={record.photo_url}
                      alt="첨부 사진"
                      className="w-16 h-16 object-cover rounded-lg ml-4"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">
            아직 등록된 증거가 없습니다.
          </div>
        )}
      </div>

      {/* Report Section - Only show for active cases */}
      {caseDetail.status === 'active' && (
        <div className="bg-white p-6 rounded-lg border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold mb-4">보고서 제출</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">
            조사가 완료되면 최종 보고서를 작성하여 제출해 주세요.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)] text-white rounded-lg
              hover:opacity-90 min-h-[44px]"
            onClick={() => {
              resetReportForm();
              setShowReportModal(true);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            보고서 작성
          </button>
        </div>
      )}

      <Modal
        isOpen={showRecordModal}
        onClose={handleCloseRecordModal}
        title="현장 기록 등록"
        description="조사 과정에서 확인한 내용을 기록해 주세요."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseRecordModal} disabled={recordSubmitting}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRecord}
              isLoading={recordSubmitting}
              disabled={!recordContent.trim() || (recordType === 'photo' && !recordPhotoFile)}
            >
              기록 저장
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="record-type" className="block text-sm font-medium text-neutral-700 mb-1.5">
              기록 유형
            </label>
            <select
              id="record-type"
              value={recordType}
              onChange={(e) => {
                const nextType = e.target.value as FieldRecord['record_type'];
                setRecordType(nextType);
                if (nextType !== 'photo') {
                  setRecordPhotoFile(null);
                  setRecordPhotoProgress(null);
                  setRecordPhotoInputKey((prev) => prev + 1);
                }
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {recordTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {getRecordTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="record-content" className="block text-sm font-medium text-neutral-700 mb-1.5">
              기록 내용
            </label>
            <textarea
              id="record-content"
              value={recordContent}
              onChange={(e) => setRecordContent(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="현장 상황과 핵심 내용을 입력해 주세요."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="위도 (선택)"
              type="number"
              value={recordGpsLat}
              onChange={(e) => setRecordGpsLat(e.target.value)}
              placeholder="37.5665"
              inputSize="sm"
            />
            <Input
              label="경도 (선택)"
              type="number"
              value={recordGpsLng}
              onChange={(e) => setRecordGpsLng(e.target.value)}
              placeholder="126.9780"
              inputSize="sm"
            />
          </div>

          {recordType === 'photo' && (
            <div className="space-y-2">
              <label
                htmlFor="record-photo"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                사진 파일
              </label>
              <input
                key={recordPhotoInputKey}
                id="record-photo"
                type="file"
                accept="image/*"
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => {
                  setError(null);
                  setRecordPhotoProgress(null);
                  const file = event.target.files?.[0] ?? null;
                  if (!file) {
                    setRecordPhotoFile(null);
                    return;
                  }
                  if (file.type && !file.type.startsWith('image/')) {
                    setError('이미지 파일만 업로드할 수 있습니다.');
                    setRecordPhotoFile(null);
                    event.currentTarget.value = '';
                    return;
                  }
                  if (file.size > maxRecordPhotoSizeBytes) {
                    setError(`사진 파일은 최대 ${maxRecordPhotoSizeMb}MB까지 업로드할 수 있습니다.`);
                    setRecordPhotoFile(null);
                    event.currentTarget.value = '';
                    return;
                  }
                  setRecordPhotoFile(file);
                }}
              />
              {recordPhotoFile && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {recordPhotoFile.name} · {formatFileSize(recordPhotoFile.size)}
                </div>
              )}
              {recordPhotoProgress !== null && recordSubmitting && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  업로드 진행률: {recordPhotoProgress}%
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        title="조사 보고서 작성"
        description="조사 결과를 요약하고 결론을 작성해 주세요."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseReportModal} disabled={reportSubmitting}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitReport}
              isLoading={reportSubmitting}
              disabled={
                !reportForm.summary.trim() ||
                !reportForm.findings.trim() ||
                !reportForm.conclusion.trim()
              }
            >
              보고서 제출
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="report-summary" className="block text-sm font-medium text-neutral-700 mb-1.5">
              요약
            </label>
            <textarea
              id="report-summary"
              value={reportForm.summary}
              onChange={(e) => setReportForm((prev) => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="조사 결과를 간단히 요약해 주세요."
            />
          </div>

          <div>
            <label htmlFor="report-findings" className="block text-sm font-medium text-neutral-700 mb-1.5">
              주요 발견 사항
            </label>
            <textarea
              id="report-findings"
              value={reportForm.findings}
              onChange={(e) => setReportForm((prev) => ({ ...prev, findings: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="조사 과정에서 확인된 핵심 사실을 작성해 주세요."
            />
          </div>

          <div>
            <label htmlFor="report-conclusion" className="block text-sm font-medium text-neutral-700 mb-1.5">
              결론 및 제안
            </label>
            <textarea
              id="report-conclusion"
              value={reportForm.conclusion}
              onChange={(e) => setReportForm((prev) => ({ ...prev, conclusion: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="결론과 후속 조치 제안을 작성해 주세요."
            />
          </div>

          <div>
            <label htmlFor="report-attachments" className="block text-sm font-medium text-neutral-700 mb-1.5">
              첨부 링크 (선택)
            </label>
            <textarea
              id="report-attachments"
              value={reportForm.attachments}
              onChange={(e) => setReportForm((prev) => ({ ...prev, attachments: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="첨부 링크를 한 줄에 하나씩 입력해 주세요."
            />
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">의뢰 거절</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              거절 사유를 입력해 주세요.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유..."
              rows={3}
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg
                  hover:bg-[var(--color-bg-secondary)] min-h-[44px]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 bg-[var(--color-error)] text-white rounded-lg
                  hover:opacity-90 disabled:opacity-50 min-h-[44px]"
              >
                {actionLoading ? '처리중...' : '거절하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
