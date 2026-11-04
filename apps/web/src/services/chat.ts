/* Service layer for Afferent Commerce - API and WebSocket abstraction */

export class ChatService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(onMessage: (data: Record<string, unknown>) => void, onOpen?: () => void, onClose?: () => void): WebSocket {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    const socket = new WebSocket(this.url);
    this.ws = socket;

    socket.onopen = () => {
      onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        onMessage(data);
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    socket.onclose = () => {
      onClose?.();
      this.reconnectTimer = window.setTimeout(() => this.connect(onMessage, onOpen, onClose), 3000);
    };

    socket.onerror = () => {
      socket.close();
    };

    return socket;
  }

  sendMessage(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export { settleAndDispatch } from './settlement';
export { getOrders } from './settlement';
export { qualityAssess } from './settlement';
export { fetchOrders } from './orders';
export { executeSettlement } from './orders';