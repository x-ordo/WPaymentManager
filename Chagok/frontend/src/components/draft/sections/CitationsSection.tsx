/**
 * Citations Section
 * Displays evidence citations linked to the draft
 */

import { DraftCitation } from '@/types/draft';

interface CitationsSectionProps {
    citations: DraftCitation[];
}

export default function CitationsSection({ citations }: CitationsSectionProps) {
    return (
        <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">Citations</h4>
            <div className="space-y-3">
                {citations.map((citation) => (
                    <div
                        key={citation.evidenceId}
                        className="rounded-lg border border-gray-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-900/60 p-3"
                    >
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {citation.title}
                        </p>
                        <p className="text-sm text-neutral-700 leading-relaxed">
                            &ldquo;{citation.quote}&rdquo;
                        </p>
                    </div>
                ))}
                {citations.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        아직 연결된 증거가 없습니다.
                    </p>
                )}
            </div>
        </div>
    );
}
