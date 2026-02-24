import { act, renderHook, waitFor } from '@testing-library/react';
import {
  MockWebSocket,
  installMockWebSocket,
  uninstallMockWebSocket,
  suppressWebSocketLogs,
  restoreWebSocketLogs,
} from './utils/mockWebSocket';
import type { Message } from '@/types/message';

const mockGetMessages = jest.fn();
const mockSendMessageApi = jest.fn();
const mockMarkMessagesReadApi = jest.fn();
const mockGetWebSocketToken = jest.fn();
const mockBuildWebSocketUrl = jest.fn();

jest.mock('@/lib/api/messages', () => ({
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  sendMessage: (...args: unknown[]) => mockSendMessageApi(...args),
  markMessagesRead: (...args: unknown[]) => mockMarkMessagesReadApi(...args),
  getWebSocketToken: (...args: unknown[]) => mockGetWebSocketToken(...args),
  buildWebSocketUrl: (token: string) => mockBuildWebSocketUrl(token),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-jwt-token',
    user: { id: 'user-1', role: 'lawyer', name: 'User' },
  }),
}));

beforeAll(() => {
  installMockWebSocket({ autoOpen: false });
  suppressWebSocketLogs();
});
afterAll(() => {
  uninstallMockWebSocket();
  restoreWebSocketLogs();
});

import { useMessages } from '@/hooks/useMessages';

describe('useMessages WebSocket TDD', () => {
  const mockCaseId = 'case-123';
  const mockRecipientId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
    MockWebSocket.clearInstances();
    MockWebSocket.configure({ autoOpen: false });

    mockGetMessages.mockResolvedValue({
      data: { messages: [], total: 0, has_more: false },
      error: null,
    });
    mockGetWebSocketToken.mockResolvedValue({
      data: { token: 'mock-jwt-token', expires_in: 300 },
      error: null,
    });
    mockBuildWebSocketUrl.mockReturnValue('ws://localhost/messages/ws?token=mock');
  });

  test('initializes with wsError null and isConnected false', () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    expect(result.current.wsError).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  test('creates WebSocket with tokenized URL', async () => {
    renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    expect(mockBuildWebSocketUrl).toHaveBeenCalledWith('mock-jwt-token');
    expect(MockWebSocket.instances[0].url).toBe(
      'ws://localhost/messages/ws?token=mock'
    );
  });

  test('sets wsError on ws.onerror', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].onerror?.(new Event('error'));
    });

    await waitFor(() => {
      expect(result.current.wsError).toBe(
        '실시간 연결이 끊어졌습니다. 재연결 시도 중...'
      );
    });
  });

  test('clears wsError when ws.onopen fires', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].onerror?.(new Event('error'));
    });

    await waitFor(() => {
      expect(result.current.wsError).toBe(
        '실시간 연결이 끊어졌습니다. 재연결 시도 중...'
      );
    });

    act(() => {
      MockWebSocket.instances[0].onopen?.(new Event('open'));
    });

    await waitFor(() => {
      expect(result.current.wsError).toBeNull();
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('schedules reconnect on ws.onclose', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const initialCount = MockWebSocket.instances.length;

    act(() => {
      MockWebSocket.instances[0].onclose?.(new CloseEvent('close'));
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBeGreaterThan(initialCount);
    });

    expect(result.current.isConnected).toBe(false);
    jest.useRealTimers();
  });

  test('ignores new_message for other case_id', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const otherCaseMessage: Message = {
      id: 'msg-other-1',
      case_id: 'case-999',
      sender: { id: 'user-999', name: 'Other', role: 'client' },
      recipient_id: mockRecipientId,
      content: '다른 사건 메시지',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'new_message',
        payload: otherCaseMessage,
      });
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(0);
    });
  });

  test('adds new_message for current case_id', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const newMessage: Message = {
      id: 'msg-new-1',
      case_id: mockCaseId,
      sender: { id: 'user-456', name: 'Client', role: 'client' },
      recipient_id: mockRecipientId,
      content: '새 메시지입니다',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'new_message',
        payload: newMessage,
      });
    });

    await waitFor(() => {
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({ id: 'msg-new-1', content: '새 메시지입니다' })
      );
    });
  });

  test('filters offline_messages by case_id', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const matchingMessage: Message = {
      id: 'msg-offline-1',
      case_id: mockCaseId,
      sender: { id: 'user-456', name: 'Client', role: 'client' },
      recipient_id: mockRecipientId,
      content: '현재 사건 메시지',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };
    const otherCaseMessage: Message = {
      id: 'msg-offline-2',
      case_id: 'case-999',
      sender: { id: 'user-999', name: 'Other', role: 'client' },
      recipient_id: mockRecipientId,
      content: '다른 사건 메시지',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'offline_messages',
        payload: { messages: [matchingMessage, otherCaseMessage] },
      });
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('msg-offline-1');
    });
  });

  test('updates read_receipt only for matching message_ids', async () => {
    const initialMessage: Message = {
      id: 'msg-1',
      case_id: mockCaseId,
      sender: { id: 'user-456', name: 'Client', role: 'client' },
      recipient_id: mockRecipientId,
      content: '읽음 처리 대상',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };
    mockGetMessages.mockResolvedValueOnce({
      data: { messages: [initialMessage], total: 1, has_more: false },
      error: null,
    });

    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    const readAt = new Date().toISOString();

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'read_receipt',
        payload: { message_ids: ['msg-1', 'msg-2'], read_at: readAt },
      });
    });

    await waitFor(() => {
      expect(result.current.messages[0].read_at).toBe(readAt);
    });
  });

  test('sets isTyping only for same case_id and other user', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: 'case-999',
          user_id: 'user-456',
          is_typing: true,
        },
      });
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-1',
          is_typing: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });
  });

  test('clears typing indicator after 3 seconds', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    jest.useRealTimers();
  });

  test('clears typing indicator immediately when is_typing is false', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: false,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });

  test('ignores duplicate new_message IDs', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const newMessage: Message = {
      id: 'msg-dup-1',
      case_id: mockCaseId,
      sender: { id: 'user-456', name: 'Client', role: 'client' },
      recipient_id: mockRecipientId,
      content: '중복 메시지',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'new_message',
        payload: newMessage,
      });
      MockWebSocket.instances[0].simulateMessage({
        type: 'new_message',
        payload: newMessage,
      });
    });

    await waitFor(() => {
      expect(
        result.current.messages.filter((message) => message.id === 'msg-dup-1')
      ).toHaveLength(1);
    });
  });

  test('resets typing timeout on repeated is_typing true events', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.isTyping).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    jest.useRealTimers();
  });

  test('deduplicates offline_messages by ID', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const offlineMessage: Message = {
      id: 'msg-offline-dup',
      case_id: mockCaseId,
      sender: { id: 'user-456', name: 'Client', role: 'client' },
      recipient_id: mockRecipientId,
      content: '오프라인 중복',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'offline_messages',
        payload: { messages: [offlineMessage, offlineMessage] },
      });
    });

    await waitFor(() => {
      expect(
        result.current.messages.filter(
          (message) => message.id === 'msg-offline-dup'
        )
      ).toHaveLength(1);
    });
  });

  test('ignores read_receipt for unknown message IDs', async () => {
    const existingMessage: Message = {
      id: 'msg-known',
      case_id: mockCaseId,
      sender: { id: 'user-456', name: 'Client', role: 'client' },
      recipient_id: mockRecipientId,
      content: '이미 있는 메시지',
      attachments: undefined,
      read_at: undefined,
      created_at: new Date().toISOString(),
      is_mine: false,
    };
    mockGetMessages.mockResolvedValueOnce({
      data: { messages: [existingMessage], total: 1, has_more: false },
      error: null,
    });

    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'read_receipt',
        payload: {
          message_ids: ['msg-unknown'],
          read_at: new Date().toISOString(),
        },
      });
    });

    await waitFor(() => {
      expect(result.current.messages[0].read_at).toBeUndefined();
    });
  });

  test('clears prior typing timeout before scheduling a new one', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    act(() => {
      MockWebSocket.instances[0].simulateMessage({
        type: 'typing',
        payload: {
          case_id: mockCaseId,
          user_id: 'user-456',
          is_typing: true,
        },
      });
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(result.current.isTyping).toBe(true);

    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  test('does not flip isConnected on ws.onerror', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].onopen?.(new Event('open'));
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      MockWebSocket.instances[0].onerror?.(new Event('error'));
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('does not overwrite wsError on ws.onclose when already set', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    act(() => {
      MockWebSocket.instances[0].onerror?.(new Event('error'));
    });

    await waitFor(() => {
      expect(result.current.wsError).toBe(
        '실시간 연결이 끊어졌습니다. 재연결 시도 중...'
      );
    });

    act(() => {
      MockWebSocket.instances[0].onclose?.(new CloseEvent('close'));
    });

    await waitFor(() => {
      expect(result.current.wsError).toBe(
        '실시간 연결이 끊어졌습니다. 재연결 시도 중...'
      );
    });
  });

  test('schedules only one reconnect when multiple closes fire', async () => {
    jest.useFakeTimers();
    renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const initialCount = MockWebSocket.instances.length;

    act(() => {
      MockWebSocket.instances[0].onclose?.(new CloseEvent('close'));
      MockWebSocket.instances[0].onclose?.(new CloseEvent('close'));
    });

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(initialCount + 1);
    });

    jest.useRealTimers();
  });

  test('sends typing indicator when socket is open', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    MockWebSocket.instances[0].readyState = MockWebSocket.OPEN;

    act(() => {
      result.current.sendTypingIndicator(true);
    });

    expect(MockWebSocket.instances[0].send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"typing"')
    );
  });

  test('sendTypingIndicator is a no-op when socket is not open', async () => {
    const { result } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    expect(MockWebSocket.instances[0].readyState).toBe(
      MockWebSocket.CONNECTING
    );

    act(() => {
      result.current.sendTypingIndicator(true);
    });

    expect(MockWebSocket.instances[0].send).not.toHaveBeenCalled();
  });

  test('closes WebSocket on unmount', async () => {
    const { unmount } = renderHook(() =>
      useMessages({ caseId: mockCaseId, recipientId: mockRecipientId })
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const wsInstance = MockWebSocket.instances[0];

    unmount();

    expect(wsInstance.close).toHaveBeenCalled();
  });
});
