import { useCallback, useState } from 'react';
import { logger } from '@/lib/logger';
import { getEvidenceDetail } from '@/lib/api/evidence';
import type { Evidence } from '@/types/evidence';

export function useEvidenceModals() {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [evidenceContent, setEvidenceContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const [isSpeakerMappingModalOpen, setIsSpeakerMappingModalOpen] = useState(false);
  const [speakerMappingEvidence, setSpeakerMappingEvidence] = useState<Evidence | null>(null);

  const openSummary = useCallback((evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setIsSummaryModalOpen(true);
  }, []);

  const closeSummary = useCallback(() => {
    setIsSummaryModalOpen(false);
    setSelectedEvidence(null);
  }, []);

  const openContent = useCallback(async (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setIsContentModalOpen(true);
    setIsLoadingContent(true);
    setEvidenceContent(null);

    try {
      const result = await getEvidenceDetail(evidence.id);
      if (result.data?.content) {
        setEvidenceContent(result.data.content);
      }
    } catch (err) {
      logger.error('Failed to fetch evidence content:', err);
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  const closeContent = useCallback(() => {
    setIsContentModalOpen(false);
    setSelectedEvidence(null);
    setEvidenceContent(null);
  }, []);

  const openSpeakerMapping = useCallback((evidence: Evidence) => {
    setSpeakerMappingEvidence(evidence);
    setIsSpeakerMappingModalOpen(true);
  }, []);

  const closeSpeakerMapping = useCallback(() => {
    setIsSpeakerMappingModalOpen(false);
    setSpeakerMappingEvidence(null);
  }, []);

  return {
    selectedEvidence,
    isSummaryModalOpen,
    isContentModalOpen,
    evidenceContent,
    isLoadingContent,
    openSummary,
    closeSummary,
    openContent,
    closeContent,
    isSpeakerMappingModalOpen,
    speakerMappingEvidence,
    openSpeakerMapping,
    closeSpeakerMapping,
  };
}
