/**
 * AI Summary Modal Component
 * Displays AI-generated summary for evidence
 */

import { Sparkles, X } from 'lucide-react';
import type { Evidence } from '@/types/evidence';

interface AISummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    evidence: Evidence | null;
}

export function AISummaryModal({ isOpen, onClose, evidence }: AISummaryModalProps) {
    if (!isOpen || !evidence) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">AI 요약</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">파일명</p>
                    <p className="text-sm font-medium text-gray-900">{evidence.filename}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {evidence.summary || '요약이 아직 생성되지 않았습니다.'}
                    </p>
                </div>

                <div className="mt-4 flex justify-end">
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
