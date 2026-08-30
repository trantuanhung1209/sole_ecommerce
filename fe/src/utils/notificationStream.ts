import { connectSseStream } from "@/utils/sseClient";
import { isNetworkError } from "@/utils/networkError";

type StreamListener = (event: string, data: string) => void;
type ConnectionListener = (connected: boolean) => void;

let abortController: AbortController | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let connected = false;
let connecting = false;
let retryAttempt = 0;

const streamListeners = new Set<StreamListener>();
const connectionListeners = new Set<ConnectionListener>();

function setConnected(next: boolean) {
  if (connected === next) return;
  connected = next;
  connectionListeners.forEach((listener) => listener(next));
}

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function dispatchEvent(event: string, data: string) {
  streamListeners.forEach((listener) => listener(event, data));
}

async function runConnection() {
  if (connecting || streamListeners.size === 0) return;

  clearRetry();
  abortController?.abort();
  const controller = new AbortController();
  abortController = controller;
  connecting = true;

  try {
    await connectSseStream(
      "/notifications/stream",
      (event, data) => {
        if (event === "connected") {
          retryAttempt = 0;
          setConnected(true);
          return;
        }
        dispatchEvent(event, data);
      },
      controller.signal
    );

    if (!controller.signal.aborted && streamListeners.size > 0) {
      setConnected(false);
      scheduleReconnect();
    }
  } catch (error) {
    if (!controller.signal.aborted && streamListeners.size > 0) {
      setConnected(false);
      if (retryAttempt === 0 && isNetworkError(error)) {
        console.warn("Notification stream disconnected (backend may be restarting). Retrying...");
      }
      scheduleReconnect();
    }
  } finally {
    connecting = false;
  }
}

function scheduleReconnect() {
  clearRetry();
  const delayMs = Math.min(5000 * 2 ** retryAttempt, 30000);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    void runConnection();
  }, delayMs);
}

function ensureConnection() {
  if (!connecting && (!abortController || abortController.signal.aborted)) {
    void runConnection();
  }
}

function stopConnection() {
  clearRetry();
  abortController?.abort();
  abortController = null;
  connecting = false;
  retryAttempt = 0;
  setConnected(false);
}

export function subscribeNotificationStream(
  onEvent: StreamListener,
  onConnectionChange?: ConnectionListener
): () => void {
  streamListeners.add(onEvent);
  if (onConnectionChange) {
    connectionListeners.add(onConnectionChange);
    onConnectionChange(connected);
  }

  ensureConnection();

  return () => {
    streamListeners.delete(onEvent);
    if (onConnectionChange) {
      connectionListeners.delete(onConnectionChange);
    }
    if (streamListeners.size === 0) {
      stopConnection();
    }
  };
}
