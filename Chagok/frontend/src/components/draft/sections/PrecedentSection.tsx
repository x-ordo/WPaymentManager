/**
 * Precedent Section
 * Displays similar legal precedent citations
 * Part of 012-precedent-integration feature
 */

import { Scale, ExternalLink } from 'lucide-react';
import { PrecedentCitation } from '@/types/draft';

interface PrecedentSectionProps {
    precedentCitations: PrecedentCitation[];
}

export default function PrecedentSection({ precedentCitations }: PrecedentSectionProps) {
    return (
        <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-gray-200">
                    유사 판례 참고자료
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                    {precedentCitations.length}건
                </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {precedentCitations.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        참고 가능한 유사 판례가 없습니다.
                    </p>
                )}
                {precedentCitations.map((precedent, index) => (
                    <div
                        key={precedent.case_ref + index}
                        className="rounded-xl border border-blue-100 dark:border-blue-800 bg-white dark:bg-neutral-800 p-3 space-y-2"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {precedent.case_ref}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {precedent.court} | {precedent.decision_date}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                    유사도 {Math.round(precedent.similarity_score * 100)}%
                                </span>
                                {precedent.source_url && (
                                    <a
                                        href={precedent.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                        title="법령정보센터에서 원문 보기"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                            {precedent.summary}
                        </p>
                        {precedent.key_factors && precedent.key_factors.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {precedent.key_factors.map((factor, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                                    >
                                        {factor}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
