const BASE = 'http://localhost:3000/api';

export type TableVerifyResponse = {
  valid: true;
  tableId: number;
  tableNumber: number;
  restaurantId: number;
  restaurantName: string;
  currency: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  available: boolean;
};

export type ActiveOrderResponse = {
  hasActiveOrder: boolean;
  order: { id: number; status: string; total: number } | null;
};

export type CreateOrderResponse = {
  id: number;
  status: string;
  total: number;
};

export async function verifyTable(tableId: number, token: string) {
  const res = await fetch(`${BASE}/auth/table/${tableId}/verify?t=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error('Invalid or expired table link');
  return res.json() as Promise<TableVerifyResponse>;
}

export async function fetchMenu(restaurantId: number) {
  const res = await fetch(`${BASE}/menu?restaurantId=${restaurantId}`);
  if (!res.ok) throw new Error('Could not load menu');
  return res.json() as Promise<MenuItem[]>;
}

export async function fetchActiveOrder(tableId: number, token: string) {
  const res = await fetch(`${BASE}/orders/active/${tableId}?t=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error('Could not check active order');
  return res.json() as Promise<ActiveOrderResponse>;
}

export async function createOrder(payload: {
  tableId: number;
  token: string;
  items: { menuItemId: number; quantity: number }[];
}) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tableId: payload.tableId,
      tableToken: payload.token,
      items: payload.items,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new Error(message ?? 'Order failed');
  }

  const order = await res.json();
  return { id: order.id, status: order.status, total: order.total } as CreateOrderResponse;
}
