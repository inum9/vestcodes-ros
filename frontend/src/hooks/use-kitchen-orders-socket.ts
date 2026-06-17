import { useEffect, useRef, useState } from 'react';
import { getToken } from '@/lib/auth';
import type { KitchenOrder } from '@/lib/kitchen-api';

type WsMessage =
  | { event: 'snapshot'; payload: KitchenOrder[] }
  | { event: 'order_created'; payload: KitchenOrder }
  | { event: 'order_updated'; payload: { orderId: number; status: string; updatedAt: string } };

type UseKitchenOrdersSocketOptions = {
  onOrderCreated?: (order: KitchenOrder) => void;
  onOrderUpdated?: (payload: { orderId: number; status: string; updatedAt: string }) => void;
};

const WS_BASE = 'ws://localhost:3000/ws';
const MUTE_KEY = 'ros_kitchen_mute';

export function isKitchenMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setKitchenMuted(muted: boolean) {
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}

export function useKitchenOrdersSocket(
  onSnapshot: (orders: KitchenOrder[]) => void,
  options: UseKitchenOrdersSocketOptions = {},
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
