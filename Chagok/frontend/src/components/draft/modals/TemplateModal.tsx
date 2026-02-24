/**
 * Template Selection Modal
 * Displays available legal document templates
 */

import { X } from 'lucide-react';
import { DOCUMENT_TEMPLATES } from '../utils/draftFormatters';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyTemplate: (templateContent: string) => void;
}

export default function TemplateModal({
    isOpen,
    onClose,
    onApplyTemplate,
}: TemplateModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
            role="dialog"
            aria-label="템플릿 선택"
        >
            <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        법률 문서 템플릿
                    </h3>
                    <button
                        type="button"
                        aria-label="템플릿 모달 닫기"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {DOCUMENT_TEMPLATES.map((template) => (
                        <div
                            key={template.id}
                            className="rounded-xl border border-gray-200 dark:border-neutral-600 p-4 bg-neutral-50/40 dark:bg-neutral-900/40"
                        >
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {template.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {template.description}
                            </p>
                            <button
                                type="button"
                                onClick={() => onApplyTemplate(template.content)}
                                className="btn-secondary text-xs px-3 py-1.5"
                            >
                                템플릿 적용
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
