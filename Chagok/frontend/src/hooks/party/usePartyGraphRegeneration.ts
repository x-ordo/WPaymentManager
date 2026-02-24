import { useCallback, useEffect, useRef, useState } from 'react';
import { regeneratePartyGraph } from '@/lib/api/party';
import { logger } from '@/lib/logger';

interface UsePartyGraphRegenerationOptions {
  caseId: string;
  refresh: () => Promise<void>;
}

export function usePartyGraphRegeneration({ caseId, refresh }: UsePartyGraphRegenerationOptions) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateMessage, setRegenerateMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMessage = useCallback(() => {
    setRegenerateMessage(null);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
  }, []);

  const handleRegenerateGraph = useCallback(async () => {
    if (isRegenerating) return;

    setIsRegenerating(true);
    clearMessage();

    try {
      const result = await regeneratePartyGraph(caseId);
      setRegenerateMessage(
        `재생성 완료: 신규 ${result.new_parties_count}명, 병합 ${result.merged_parties_count}명, 관계 ${result.new_relationships_count}개`
      );
      await refresh();
      messageTimeoutRef.current = setTimeout(clearMessage, 3000);
    } catch (error) {
      logger.error('Failed to regenerate party graph:', error);
      setRegenerateMessage(
        error instanceof Error ? error.message : '인물 관계도 재생성에 실패했습니다.'
      );
      messageTimeoutRef.current = setTimeout(clearMessage, 5000);
    } finally {
      setIsRegenerating(false);
    }
  }, [caseId, clearMessage, isRegenerating, refresh]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  return {
    isRegenerating,
    regenerateMessage,
    handleRegenerateGraph,
  };
}
