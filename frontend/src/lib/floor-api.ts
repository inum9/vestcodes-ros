import { api } from './api';

export type FloorOrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  menuItem: {
    id: number;
    name: string;
  };
};

export type FloorOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  table: {
    id: number;
    number: number;
  };
  orderItems: FloorOrderItem[];
};

export function fetchOrdersByStatus(status: 'pending' | 'ready') {
  return api<FloorOrder[]>(`/orders?status=${status}`);
}

export function approveOrder(id: number) {
  return api<FloorOrder>(`/orders/${id}/approve`, { method: 'PATCH' });
}

export function rejectOrder(id: number) {
  return api<FloorOrder>(`/orders/${id}/reject`, { method: 'PATCH' });
}

export function serveOrder(id: number) {
  return api<FloorOrder>(`/orders/${id}/serve`, { method: 'PATCH' });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function minutesSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  return `${mins} mins ago`;
}

export function orderItemsSummary(order: FloorOrder) {
  return order.orderItems
    .map((line) => `${line.quantity}× ${line.menuItem.name}`)
    .join(', ');
}
