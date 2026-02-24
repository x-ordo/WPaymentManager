import { useEffect, useState } from 'react';
import { getEvidence } from '@/lib/api/evidence';
import { logger } from '@/lib/logger';
import { toEvidenceItem, type EvidenceItem } from '@/components/party/utils/graphTransformers';

interface UsePartyGraphEvidenceOptions {
  caseId: string;
  isOpen: boolean;
}

export function usePartyGraphEvidence({ caseId, isOpen }: UsePartyGraphEvidenceOptions) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [evidenceLoadError, setEvidenceLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !caseId) return;

    setIsLoadingEvidence(true);
    setEvidenceLoadError(null);

    getEvidence(caseId)
      .then((res) => {
        if (res.data?.evidence) {
          setEvidenceList(res.data.evidence.map(toEvidenceItem));
        }
      })
      .catch((err) => {
        logger.error('Failed to fetch evidence:', err);
        setEvidenceLoadError('증거 목록을 불러오는데 실패했습니다.');
      })
      .finally(() => {
        setIsLoadingEvidence(false);
      });
  }, [caseId, isOpen]);

  return {
    evidenceList,
    isLoadingEvidence,
    evidenceLoadError,
  };
}
