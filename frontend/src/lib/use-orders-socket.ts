import { useEffect, useRef, useState } from 'react';
import { getToken } from './auth';
import type { FloorOrder } from './floor-api';

type WsMessage =
  | { event: 'snapshot'; payload: FloorOrder[] }
  | { event: 'order_created'; payload: FloorOrder }
  | { event: 'order_updated'; payload: { orderId: number; status: string; updatedAt: string } };

type UseOrdersSocketOptions = {
  onOrderCreated?: (order: FloorOrder) => void;
  onOrderUpdated?: (payload: { orderId: number; status: string; updatedAt: string }) => void;
};

const WS_BASE = 'ws://localhost:3000/ws';

export function useOrdersSocket(
  onSnapshot: (orders: FloorOrder[]) => void,
  options: UseOrdersSocketOptions = {},
) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const token = getToken();
      if (!token) return;

      const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        reconnectAttempt.current = 0;
        setConnected(true);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        const delay = Math.min(30000, 1000 * 2 ** reconnectAttempt.current);
        reconnectAttempt.current += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data as string) as WsMessage;
          if (data.event === 'snapshot') {
            onSnapshot(data.payload);
            return;
          }
          if (data.event === 'order_created') {
            optionsRef.current.onOrderCreated?.(data.payload);
            return;
          }
          if (data.event === 'order_updated') {
            optionsRef.current.onOrderUpdated?.(data.payload);
          }
        } catch {
          // ignore malformed messages
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [onSnapshot]);

  return { connected };
}
