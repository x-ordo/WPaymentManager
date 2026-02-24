/**
 * Integration tests for useMessages Hook
 * Task T111 - US6 Tests
 *
 * Tests for frontend/src/hooks/useMessages.ts:
 * - WebSocket connection management
 * - Message fetching and caching
 * - Sending messages (optimistic updates)
 * - Typing indicators
 * - Read receipts
 * - Offline message handling
 * - Reconnection logic
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import type { Message, MessageListResponse, WebSocketMessage } from '@/types/message';
import {
  MockWebSocket,
  installMockWebSocket,
  uninstallMockWebSocket,
  suppressWebSocketLogs,
  restoreWebSocketLogs,
} from './utils/mockWebSocket';

beforeAll(() => {
  installMockWebSocket({ autoOpen: true, openDelayMs: 10 });
  suppressWebSocketLogs();
});
afterAll(() => {
  uninstallMockWebSocket();
  restoreWebSocketLogs();
});

// Suppress act() warnings for WebSocket async callbacks
// The warnings occur because setTimeout in MockWebSocket fires outside act()
// Tests still pass correctly - this is a known limitation with WebSocket testing
const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('not wrapped in act')
    ) {
      return; // Suppress act() warnings
    }
    originalConsoleError.call(console, ...args);
  });
});
afterAll(() => {
  jest.restoreAllMocks();
});

// Mock the messaging API
const mockGetMessages = jest.fn();
const mockSendMessageApi = jest.fn();
const mockMarkMessagesReadApi = jest.fn();
const mockGetWebSocketToken = jest.fn();
const mockBuildWebSocketUrl = jest.fn().mockReturnValue('ws://localhost:8000/messages/ws?token=mock-jwt-token');

jest.mock('@/lib/api/messages', () => ({
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  sendMessage: (...args: unknown[]) => mockSendMessageApi(...args),
  markMessagesRead: (...args: unknown[]) => mockMarkMessagesReadApi(...args),
  getWebSocketToken: (...args: unknown[]) => mockGetWebSocketToken(...args),
  buildWebSocketUrl: (token: string) => mockBuildWebSocketUrl(token),
}));

// Mock auth context to get token
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-jwt-token',
    user: { id: 'user-789', role: 'lawyer' },
  }),
}));

// Import hook after mocks
import { useMessages } from '@/hooks/useMessages';

describe('useMessages Hook', () => {
  const mockCaseId = 'case-123';
  const mockRecipientId = 'user-456';

  const mockMessageListResponse: MessageListResponse = {
    messages: [
      {
        id: 'msg-1',
        case_id: mockCaseId,
        sender: { id: 'user-456', name: '이의뢰인', role: 'client' },
        recipient_id: 'user-789',
        content: '안녕하세요',
        attachments: undefined,
        read_at: undefined,
        created_at: '2024-12-05T09:00:00Z',
        is_mine: false,
      },
    ],
    total: 1,
    has_more: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockWebSocket.clearInstances();
    MockWebSocket.configure({ autoOpen: true, openDelayMs: 10 });

    mockGetWebSocketToken.mockResolvedValue({
      data: { token: 'mock-jwt-token', expires_in: 300 },
      error: null,
    });

    mockGetMessages.mockResolvedValue({
      data: mockMessageListResponse,
      error: null,
    });

    mockSendMessageApi.mockResolvedValue({
      data: {
        id: 'msg-new',
        case_id: mockCaseId,
        sender: { id: 'user-789', name: '김변호사', role: 'lawyer' },
        recipient_id: mockRecipientId,
        content: '테스트 메시지',
        attachments: undefined,
        read_at: undefined,
        created_at: new Date().toISOString(),
        is_mine: true,
      },
      error: null,
    });

    mockMarkMessagesReadApi.mockResolvedValue({
      data: { marked_count: 1 },
      error: null,
    });
  });

  describe('Initialization', () => {
    test('should return initial state', async () => {
      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    test('should fetch messages on mount', async () => {
      renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(mockGetMessages).toHaveBeenCalledWith(
          mockCaseId,
          expect.objectContaining({
            otherUserId: mockRecipientId,
          })
        );
      });
    });

    test('should update messages after fetch', async () => {
      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('안녕하세요');
      });
    });

    test('should set isLoading to false after fetch', async () => {
      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });


  describe('Sending Messages', () => {
    test('should call sendMessage function', async () => {
      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage({
          case_id: mockCaseId,
          recipient_id: mockRecipientId,
          content: '테스트 메시지',
        });
      });

      expect(mockSendMessageApi).toHaveBeenCalledWith({
        case_id: mockCaseId,
        recipient_id: mockRecipientId,
        content: '테스트 메시지',
      });
    });

    test('should add message optimistically before API response', async () => {
      // Delay API response
      mockSendMessageApi.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    id: 'msg-new',
                    case_id: mockCaseId,
                    sender: { id: 'user-789', name: '김변호사', role: 'lawyer' },
                    recipient_id: mockRecipientId,
                    content: '테스트 메시지',
                    attachments: undefined,
                    read_at: undefined,
                    created_at: new Date().toISOString(),
                    is_mine: true,
                  },
                  error: null,
                }),
              100
            )
          )
      );

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Don't await - check optimistic update
      act(() => {
        result.current.sendMessage({
          case_id: mockCaseId,
          recipient_id: mockRecipientId,
          content: '테스트 메시지',
        });
      });

      // Message should appear immediately (optimistic)
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({ content: '테스트 메시지' })
      );
    });

    test('should replace optimistic message with server response', async () => {
      mockSendMessageApi.mockResolvedValueOnce({
        data: {
          id: 'msg-real',
          case_id: mockCaseId,
          sender: { id: 'user-789', name: '김변호사', role: 'lawyer' },
          recipient_id: mockRecipientId,
          content: '테스트 메시지',
          attachments: undefined,
          read_at: undefined,
          created_at: new Date().toISOString(),
          is_mine: true,
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage({
          case_id: mockCaseId,
          recipient_id: mockRecipientId,
          content: '테스트 메시지',
        });
      });

      await waitFor(() => {
        expect(result.current.messages).toContainEqual(
          expect.objectContaining({ id: 'msg-real', content: '테스트 메시지' })
        );
      });

      expect(
        result.current.messages.filter(
          (message) =>
            message.content === '테스트 메시지' &&
            message.id.startsWith('temp-')
        )
      ).toHaveLength(0);
    });

    test('should rollback on send failure', async () => {
      mockSendMessageApi.mockResolvedValue({
        data: null,
        error: '전송 실패',
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.sendMessage({
            case_id: mockCaseId,
            recipient_id: mockRecipientId,
            content: '실패할 메시지',
          });
        } catch {
          // Expected to fail
        }
      });

      // Optimistically added message should be removed
      await waitFor(() => {
        expect(result.current.messages).not.toContainEqual(
          expect.objectContaining({ content: '실패할 메시지' })
        );
      });
    });

    test('should throw when sendMessage returns an error', async () => {
      mockSendMessageApi.mockResolvedValue({
        data: null,
        error: '전송 실패',
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.sendMessage({
          case_id: mockCaseId,
          recipient_id: mockRecipientId,
          content: '에러 메시지',
        })
      ).rejects.toThrow('전송 실패');
    });
  });

  describe('Read Receipts', () => {
    test('should call markAsRead function', async () => {
      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.markAsRead(['msg-1']);
      });

      expect(mockMarkMessagesReadApi).toHaveBeenCalledWith(['msg-1']);
    });

    test('should not throw when markAsRead fails', async () => {
      mockMarkMessagesReadApi.mockRejectedValueOnce(new Error('mark failed'));

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.markAsRead(['msg-1'])).resolves.toBeUndefined();
    });
  });

  describe('Pagination', () => {
    test('should return hasMore from API response', async () => {
      mockGetMessages.mockResolvedValue({
        data: {
          ...mockMessageListResponse,
          has_more: true,
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });
    });

    test('should call loadMore with correct parameters', async () => {
      mockGetMessages.mockResolvedValue({
        data: {
          ...mockMessageListResponse,
          has_more: true,
        },
        error: null,
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      // Should call with beforeId of oldest message
      expect(mockGetMessages).toHaveBeenLastCalledWith(
        mockCaseId,
        expect.objectContaining({
          beforeId: 'msg-1',
        })
      );
    });

    test('should append older messages to list', async () => {
      const olderMessages: Message[] = [
        {
          id: 'msg-0',
          case_id: mockCaseId,
          sender: { id: 'user-456', name: '이의뢰인', role: 'client' },
          recipient_id: 'user-789',
          content: '이전 메시지',
          attachments: undefined,
          read_at: undefined,
          created_at: '2024-12-05T08:00:00Z',
          is_mine: false,
        },
      ];

      mockGetMessages
        .mockResolvedValueOnce({
          data: { ...mockMessageListResponse, has_more: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { messages: olderMessages, total: 2, has_more: false },
          error: null,
        });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
        // Older messages should be prepended
        expect(result.current.messages[0].id).toBe('msg-0');
      });
    });

    test('should skip loadMore when no messages are loaded', async () => {
      mockGetMessages.mockResolvedValueOnce({
        data: { messages: [], total: 0, has_more: false },
        error: null,
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.messages).toHaveLength(0);
      });

      const callCount = mockGetMessages.mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockGetMessages).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('Error Handling', () => {
    test('should set error when fetch fails', async () => {
      mockGetMessages.mockResolvedValue({
        data: null,
        error: '메시지를 불러오는데 실패했습니다.',
      });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.error).toBe('메시지를 불러오는데 실패했습니다.');
      });
    });

    test('should clear error on retry', async () => {
      mockGetMessages
        .mockResolvedValueOnce({
          data: null,
          error: '에러',
        })
        .mockResolvedValueOnce({
          data: mockMessageListResponse,
          error: null,
        });

      const { result } = renderHook(() =>
        useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
      );

      await waitFor(() => {
        expect(result.current.error).toBe('에러');
      });

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

});
