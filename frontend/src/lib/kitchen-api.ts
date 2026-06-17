import { api } from './api';

export type KitchenOrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  menuItem: {
    id: number;
    name: string;
    category: string;
  };
};

export type KitchenOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  table: {
    id: number;
    number: number;
  };
  orderItems: KitchenOrderItem[];
};

export function fetchKitchenOrders(status: 'approved' | 'preparing' | 'ready') {
  return api<KitchenOrder[]>(`/orders?status=${status}`);
}

export function advanceOrder(id: number) {
  return api<KitchenOrder>(`/orders/${id}/advance`, { method: 'PATCH' });
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

export function orderItemsSummary(order: KitchenOrder) {
  return order.orderItems.map((line) => `${line.quantity}× ${line.menuItem.name}`).join(', ');
}
