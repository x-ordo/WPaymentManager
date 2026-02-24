type MockWebSocketConfig = {
  autoOpen?: boolean;
  openDelayMs?: number;
};

let originalWebSocket: typeof WebSocket | null = null;
let originalConsoleLog: typeof console.log | null = null;

export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static autoOpen = false;
  static openDelayMs = 0;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  url: string;

  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);

    if (MockWebSocket.autoOpen) {
      setTimeout(() => {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.(new Event('open'));
      }, MockWebSocket.openDelayMs);
    }
  }

  static configure(config: MockWebSocketConfig = {}) {
    MockWebSocket.autoOpen = config.autoOpen ?? false;
    MockWebSocket.openDelayMs = config.openDelayMs ?? 0;
  }

  static clearInstances() {
    MockWebSocket.instances = [];
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(
      new MessageEvent('message', { data: JSON.stringify(data) })
    );
  }

  simulateDisconnect() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

export function installMockWebSocket(config: MockWebSocketConfig = {}) {
  MockWebSocket.configure(config);

  if (!originalWebSocket) {
    originalWebSocket = global.WebSocket as typeof WebSocket;
  }

  (global as unknown as { WebSocket: typeof WebSocket }).WebSocket =
    MockWebSocket as unknown as typeof WebSocket;
}

export function uninstallMockWebSocket() {
  if (originalWebSocket) {
    (global as unknown as { WebSocket: typeof WebSocket }).WebSocket =
      originalWebSocket;
    originalWebSocket = null;
  }
}

export function suppressWebSocketLogs() {
  if (originalConsoleLog) {
    return;
  }

  originalConsoleLog = console.log;
  console.log = jest.fn();
}

export function restoreWebSocketLogs() {
  if (originalConsoleLog) {
    console.log = originalConsoleLog;
    originalConsoleLog = null;
  }
}
