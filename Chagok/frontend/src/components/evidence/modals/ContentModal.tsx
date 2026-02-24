/**
 * Evidence Content Modal Component (원문 보기)
 * T016: 화자 매핑 버튼 추가
 */

import { FileText, X, Loader2, Users } from 'lucide-react';
import type { Evidence } from '@/types/evidence';

interface ContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    evidence: Evidence | null;
    content: string | null;
    isLoading: boolean;
    /** 015-evidence-speaker-mapping: 화자 매핑 버튼 표시 여부 */
    showSpeakerMappingButton?: boolean;
    /** 015-evidence-speaker-mapping: 화자 매핑 버튼 클릭 핸들러 */
    onOpenSpeakerMapping?: () => void;
}

export function ContentModal({
    isOpen,
    onClose,
    evidence,
    content,
    isLoading,
    showSpeakerMappingButton,
    onOpenSpeakerMapping,
}: ContentModalProps) {
    if (!isOpen || !evidence) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        <h3 className="text-lg font-bold text-gray-900">증거 원문</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm text-gray-500">파일명</p>
                    <p className="text-sm font-medium text-gray-900">{evidence.filename}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            <span className="ml-2 text-gray-500">원문을 불러오는 중...</span>
                        </div>
                    ) : content ? (
                        <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {content}
                        </pre>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>원문이 아직 추출되지 않았습니다.</p>
                            <p className="text-xs mt-1">AI 분석이 완료되면 원문을 볼 수 있습니다.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between">
                    {/* T016: 화자 매핑 버튼 */}
                    <div>
                        {showSpeakerMappingButton && content && (
                            <button
                                onClick={onOpenSpeakerMapping}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                화자 매핑
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
