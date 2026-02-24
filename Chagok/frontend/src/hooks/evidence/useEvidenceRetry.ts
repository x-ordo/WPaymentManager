import { useCallback, useState } from 'react';
import { retryEvidence } from '@/lib/api/evidence';
import { logger } from '@/lib/logger';

interface UseEvidenceRetryOptions {
  onRetry?: (evidenceId: string) => void;
}

export function useEvidenceRetry({ onRetry }: UseEvidenceRetryOptions) {
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const handleRetry = useCallback(
    async (evidenceId: string) => {
      setRetryingIds((prev) => new Set(prev).add(evidenceId));
      try {
        await retryEvidence(evidenceId);
        onRetry?.(evidenceId);
      } catch (err) {
        logger.error('Failed to retry evidence:', err);
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(evidenceId);
          return next;
        });
      }
    },
    [onRetry]
  );

  return {
    retryingIds,
    handleRetry,
  };
}
