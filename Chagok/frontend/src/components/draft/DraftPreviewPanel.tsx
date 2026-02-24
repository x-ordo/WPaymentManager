'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { DraftCitation, PrecedentCitation } from '@/types/draft';
import EvidenceTraceabilityPanel from './EvidenceTraceabilityPanel';
import { useDraftEditor, useDraftVersionHistory } from '@/hooks/draft';
import {
    DraftVersionSnapshot,
    DraftCommentSnapshot,
    DraftChangeLogEntry,
    loadDraftState,
    persistDraftState,
} from '@/services/draftStorageService';
import { sanitizeDraftHtml, stripHtml } from './utils/draftHtmlUtils';
import {
    AUTOSAVE_INTERVAL_MS,
    HISTORY_LIMIT,
} from './utils/draftFormatters';
import { VersionHistoryModal, TemplateModal, CitationModal, ExportToast, type ExportToastData } from './modals';
import { CitationsSection } from './sections';
import { DraftToolbar, CommentsPanel, ChangeLogPanel, PrecedentCitationsPanel } from './panels';

interface DraftPreviewPanelProps {
    caseId: string;
    draftText: string;
    citations: DraftCitation[];
    precedentCitations?: PrecedentCitation[];  // 012-precedent-integration: T035
    isGenerating: boolean;
    hasExistingDraft: boolean;
    onGenerate: () => void;
    onManualSave?: (content: string) => Promise<void> | void;
}

export default function DraftPreviewPanel({
    caseId,
    draftText,
    citations,
    precedentCitations = [],  // 012-precedent-integration: T035
    isGenerating,
    hasExistingDraft,
    onGenerate,
    onManualSave,
}: DraftPreviewPanelProps) {
    const buttonLabel = hasExistingDraft ? '초안 재생성' : '초안 생성';
    const [editorHtml, setEditorHtml] = useState(() => sanitizeDraftHtml(draftText));
    const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
    const [isTraceabilityPanelOpen, setIsTraceabilityPanelOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [exportToast, setExportToast] = useState<ExportToastData | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const versionHistoryRef = useRef<DraftVersionSnapshot[]>([]);
    const lastSavedAtRef = useRef<string | null>(null);
    const lastImportedDraftRef = useRef<string | null>(null);
    const commentsRef = useRef<DraftCommentSnapshot[]>([]);
    const changeLogRef = useRef<DraftChangeLogEntry[]>([]);

    const sanitizedDraftText = useMemo(() => sanitizeDraftHtml(draftText), [draftText]);
    const pageCount = useMemo(() => Math.max(1, Math.ceil(stripHtml(editorHtml).length / 1800)), [editorHtml]);

    const persistCurrentState = useCallback(
        (
            content: string,
            history?: DraftVersionSnapshot[],
            savedAt?: string | null,
            commentsOverride?: DraftCommentSnapshot[],
            changeLogOverride?: DraftChangeLogEntry[]
        ) => {
            persistDraftState(caseId, {
                content,
                history: history ?? versionHistoryRef.current,
                lastSavedAt: savedAt ?? lastSavedAtRef.current,
                comments: commentsOverride ?? commentsRef.current,
                changeLog: changeLogOverride ?? changeLogRef.current,
            });
        },
        [caseId]
    );

    const {
        versionHistory,
        setVersionHistory,
        lastSavedAt,
        setLastSavedAt,
        recordVersion,
        restoreVersion,
    } = useDraftVersionHistory({
        editorHtml,
        setEditorHtml,
        persistCurrentState,
        historyLimit: HISTORY_LIMIT,
        autosaveIntervalMs: AUTOSAVE_INTERVAL_MS,
        setSaveMessage,
    });

    const {
        changeLog,
        setChangeLog,
        isTrackChangesEnabled,
        toggleTrackChanges,
        handleBeforeInput,
        handleEditorInput,
        comments,
        setComments,
        newCommentText,
        setNewCommentText,
        handleAddComment,
        handleToggleCommentResolved,
        collabStatus,
        broadcastSave,
    } = useDraftEditor({
        caseId,
        editorHtml,
        setEditorHtml,
        editorRef,
        persistCurrentState,
        setSaveMessage,
        lastImportedDraftRef,
    });

    useEffect(() => {
        versionHistoryRef.current = versionHistory;
    }, [versionHistory]);

    useEffect(() => {
        lastSavedAtRef.current = lastSavedAt;
    }, [lastSavedAt]);

    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);

    useEffect(() => {
        changeLogRef.current = changeLog;
    }, [changeLog]);

    useEffect(() => {
        const storedState = loadDraftState(caseId);
        if (storedState) {
            setEditorHtml(storedState.content || sanitizedDraftText);
            setVersionHistory(storedState.history || []);
            setLastSavedAt(storedState.lastSavedAt);
            setComments(storedState.comments || []);
            setChangeLog(storedState.changeLog || []);
            lastImportedDraftRef.current = storedState.content || sanitizedDraftText;
        } else {
            setEditorHtml(sanitizedDraftText);
            lastImportedDraftRef.current = sanitizedDraftText;
        }
    }, [caseId, sanitizedDraftText]);

    useEffect(() => {
        if (!sanitizedDraftText) return;
        if (!lastImportedDraftRef.current) {
            lastImportedDraftRef.current = sanitizedDraftText;
            return;
        }
        if (sanitizedDraftText !== lastImportedDraftRef.current) {
            setEditorHtml(sanitizedDraftText);
            recordVersion('ai', sanitizedDraftText);
            lastImportedDraftRef.current = sanitizedDraftText;
        }
    }, [sanitizedDraftText, recordVersion]);

    useEffect(() => {
        if (!editorRef.current) return;
        if (editorRef.current.innerHTML !== editorHtml) {
            editorRef.current.innerHTML = editorHtml;
        }
    }, [editorHtml]);

    const handleFormat = (command: string) => {
        document.execCommand(command, false, undefined);
    };

    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const evidenceId = target.getAttribute('data-evidence-id');

        if (evidenceId) {
            setSelectedEvidenceId(evidenceId);
            setIsTraceabilityPanelOpen(true);
        }
    };

    const handleCloseTraceability = () => {
        setIsTraceabilityPanelOpen(false);
        setSelectedEvidenceId(null);
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        try {
            recordVersion('manual');
            if (onManualSave) {
                await onManualSave(editorHtml);
            }
            broadcastSave(new Date().toISOString());
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestoreVersion = (versionId: string) => {
        const restored = restoreVersion(versionId);
        if (restored) {
            setIsHistoryOpen(false);
        }
    };

    const handleApplyTemplate = (templateContent: string) => {
        const content = sanitizeDraftHtml(templateContent);
        setEditorHtml(content);
        persistCurrentState(content);
        setIsTemplateModalOpen(false);
    };

    const handleInsertCitation = (citation: DraftCitation) => {
        const markup = `<span class="evidence-ref" data-evidence-id="${citation.evidenceId}">[증거: ${citation.title}]</span>`;
        document.execCommand('insertHTML', false, markup);
        const html = sanitizeDraftHtml(editorRef.current?.innerHTML || editorHtml);
        setEditorHtml(html);
        persistCurrentState(html);
        setIsCitationModalOpen(false);
    };

    return (
        <section className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-100 dark:border-neutral-700 p-6 space-y-6" aria-label="Draft editor">
            {/* Task 8: Red Review Warning Banner */}
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-base font-bold text-red-800 dark:text-red-200 mb-1">
                            [검토 필요] AI 생성 초안
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            본 문서는 AI가 생성한 초안으로, <strong>변호사의 검토 및 수정이 필요합니다.</strong>
                            실제 제출 전 반드시 모든 내용을 검토하고 사실 관계를 확인해 주세요.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                        이 문서는 AI가 생성한 초안이며, 최종 책임은 변호사에게 있습니다.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        실제 제출 전 반드시 모든 내용을 검토하고 사실 관계를 확인해 주세요.
                    </p>
                </div>
                <div className="inline-flex items-center text-xs uppercase tracking-wide text-secondary font-semibold">
                    <Sparkles className="w-4 h-4 mr-1 text-primary" />
                    AI Draft
                </div>
            </div>

            <DraftToolbar
                onManualSave={handleManualSave}
                isSaving={isSaving}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenTemplate={() => setIsTemplateModalOpen(true)}
                onOpenCitation={() => setIsCitationModalOpen(true)}
                isTrackChangesEnabled={isTrackChangesEnabled}
                onToggleTrackChanges={toggleTrackChanges}
                saveMessage={saveMessage}
                lastSavedAt={lastSavedAt}
                pageCount={pageCount}
                collabStatus={collabStatus}
                onFormat={handleFormat}
            />

            <div
                data-testid="draft-editor-surface"
                data-zen-mode="true"
                className="relative rounded-lg border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-inner focus-within:border-primary transition-colors"
            >
                <div
                    ref={editorRef}
                    data-testid="draft-editor-content"
                    contentEditable
                    suppressContentEditableWarning
                    aria-label="Draft content"
                    onClick={handleEditorClick}
                    onBeforeInput={handleBeforeInput}
                    onInput={handleEditorInput}
                    className="w-full min-h-[320px] bg-transparent p-6 text-gray-800 dark:text-gray-200 leading-relaxed focus:outline-none overflow-auto cursor-pointer font-mono text-sm whitespace-pre-wrap [&_.evidence-ref]:underline [&_.evidence-ref]:text-secondary [&_.evidence-ref]:cursor-pointer [&_.evidence-ref:hover]:text-primary [&_.evidence-ref]:decoration-dotted"
                    dangerouslySetInnerHTML={{ __html: editorHtml }}
                />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className={`btn-primary inline-flex items-center justify-center px-6 py-3 text-base ${isGenerating ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                    {isGenerating ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            생성 중...
                        </span>
                    ) : (
                        <span>{buttonLabel}</span>
                    )}
                </button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    최신 초안 기준 <span className="font-semibold text-secondary">실제 증거 인용</span> {citations.length}건
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-neutral-700 pt-4 space-y-6">
                <CitationsSection citations={citations} />

                {/* 012-precedent-integration: T035 - 유사 판례 인용 섹션 */}
                <PrecedentCitationsPanel precedentCitations={precedentCitations} />

                <CommentsPanel
                    comments={comments}
                    newCommentText={newCommentText}
                    onNewCommentTextChange={setNewCommentText}
                    onAddComment={handleAddComment}
                    onToggleResolved={handleToggleCommentResolved}
                />

                <ChangeLogPanel changeLog={changeLog} />
            </div>

            <EvidenceTraceabilityPanel
                isOpen={isTraceabilityPanelOpen}
                evidenceId={selectedEvidenceId}
                onClose={handleCloseTraceability}
            />

            <VersionHistoryModal
                isOpen={isHistoryOpen}
                versionHistory={versionHistory}
                onClose={() => setIsHistoryOpen(false)}
                onRestore={handleRestoreVersion}
            />

            <TemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onApplyTemplate={handleApplyTemplate}
            />

            <CitationModal
                isOpen={isCitationModalOpen}
                citations={citations}
                onClose={() => setIsCitationModalOpen(false)}
                onInsertCitation={handleInsertCitation}
            />

            <ExportToast
                toast={exportToast}
                onClose={() => setExportToast(null)}
            />
        </section>
    );
}
