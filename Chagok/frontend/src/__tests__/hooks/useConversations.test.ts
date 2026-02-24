import { renderHook, waitFor } from '@testing-library/react';

import { useConversations } from '@/hooks/useMessages';

describe('useConversations Hook', () => {
  test('exposes default values', () => {
    const { result } = renderHook(() => useConversations());

    expect(result.current.error).toBeNull();
    expect(result.current.conversations).toEqual([]);
    expect(result.current.totalUnread).toBe(0);
  });

  test('loads conversations and clears loading state', async () => {
    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.totalUnread).toBe(0);
  });

  test('refresh keeps error cleared and resolves', async () => {
    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.refresh()).resolves.toBeUndefined();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
