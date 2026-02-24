/**
 * Draft Formatting Utilities
 * Extracted from DraftPreviewPanel for reusability
 */

import { DraftSaveReason } from '@/services/draftStorageService';

/**
 * Generate a unique ID using crypto.randomUUID or fallback
 */
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * Format autosave status message based on timestamp
 */
export const formatAutosaveStatus = (timestamp: string | null): string => {
    if (!timestamp) {
        return '자동 저장 준비 중';
    }
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (diffMs < 60_000) {
        return '자동 저장됨 · 방금';
    }
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) {
        return `자동 저장됨 · ${minutes}분 전`;
    }
    const hours = Math.floor(minutes / 60);
    return `자동 저장됨 · ${hours}시간 전`;
};

/**
 * Format version save reason for display
 */
export const formatVersionReason = (reason: DraftSaveReason): string => {
    switch (reason) {
        case 'manual':
            return '수동 저장';
        case 'auto':
            return '자동 저장';
        case 'ai':
            return 'AI 초안';
        default:
            return '저장';
    }
};

/**
 * Format ISO timestamp for Korean locale display
 */
export const formatTimestamp = (iso: string): string =>
    new Date(iso).toLocaleString('ko-KR', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

/**
 * Draft constants
 */
export const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const HISTORY_LIMIT = 10;
export const CHANGELOG_LIMIT = 20;

/**
 * Document templates for legal documents
 */
export const DOCUMENT_TEMPLATES = [
    {
        id: 'answer-basic',
        name: '답변서 기본 템플릿',
        description: '사건 개요, 청구원인, 결론을 포함한 기본 양식',
        content: `
<h1>답 변 서</h1>
<p>사건번호: ________</p>
<p>원고: ________ / 피고: ________</p>
<h2>1. 사건 개요</h2>
<p>원고는 ____에 따라 본 소송을 제기하였습니다.</p>
<h2>2. 청구원인에 대한 답변</h2>
<p>원고의 주장에 대하여 피고는 다음과 같이 답변합니다.</p>
<h3>2.1 원고 주장 제1항에 대하여</h3>
<p>[증거기재]</p>
<h2>3. 결론</h2>
<p>따라서 원고의 청구는 기각되어야 합니다.</p>`,
    },
    {
        id: 'petition-basic',
        name: '준비서면 - 청구취지 강조',
        description: '청구취지, 청구원인, 증거목록으로 구성된 양식',
        content: `
<h1>준 비 서 면</h1>
<h2>1. 청구취지</h2>
<p>1. 피고는 원고에게 위자료 금 ________원을 지급하라.</p>
<h2>2. 청구원인</h2>
<h3>2.1 혼인 파탄 경위</h3>
<p>...</p>
<h3>2.2 유책 사유</h3>
<p>...</p>
<h2>3. 증거목록</h2>
<p>- 갑 제1호증: ________</p>
<p>- 갑 제2호증: ________</p>`,
    },
];
