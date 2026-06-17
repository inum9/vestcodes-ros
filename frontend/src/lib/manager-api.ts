import { api } from './api';
import { getToken } from './auth';

const BASE = 'http://localhost:3000/api';

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  available: boolean;
  imageUrl: string | null;
};

export type RestaurantTable = {
  id: number;
  number: number;
  zone: string | null;
  restaurantId: number;
};

export type OrderItemLine = {
  id: number;
  quantity: number;
  unitPrice: number;
  menuItem: { id: number; name: string };
};

export type ManagerOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  table: { id: number; number: number };
  orderItems: OrderItemLine[];
};

export type Invoice = {
  id: number;
  subtotal: number;
  gstAmount: number;
  total: number;
  createdAt: string;
  order: {
    id: number;
    table: { number: number };
    orderItems: OrderItemLine[];
  };
};

export type StaffUser = {
  id: number;
  email: string;
  role: string;
  restaurantId: number;
};

const ORDER_STATUSES = ['pending', 'approved', 'preparing', 'ready', 'served', 'rejected'] as const;

export function fetchMenuItems() {
  return api<MenuItem[]>('/menu/items');
}

export function createMenuItem(data: {
  name: string;
  description?: string;
  category: string;
  price: number;
}) {
  return api<MenuItem>('/menu/items', { method: 'POST', body: JSON.stringify(data) });
}

export function updateMenuItem(
  id: number,
  data: Partial<{ name: string; description: string; category: string; price: number }>,
) {
  return api<MenuItem>(`/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function toggleMenuItem(id: number) {
  return api<MenuItem>(`/menu/items/${id}/toggle`, { method: 'PATCH' });
}

export function fetchTables() {
  return api<RestaurantTable[]>('/tables');
}

export function createTable(data: { number: number; zone?: string }) {
  return api<RestaurantTable>('/tables', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteTable(id: number) {
  return api<{ success: boolean }>(`/tables/${id}`, { method: 'DELETE' });
}

export async function fetchTableQrBlob(tableId: number): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${BASE}/tables/${tableId}/qr`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Failed to load QR (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  if (blob.size === 0) {
    throw new Error('Empty QR response from server');
  }
  if (blob.type && !blob.type.startsWith('image/') && blob.type !== 'application/octet-stream') {
    throw new Error('Server did not return a QR image — is the backend running?');
  }
  return blob.type.startsWith('image/') ? blob : blob.slice(0, blob.size, 'image/png');
}

export async function downloadTableQr(tableId: number, tableNumber: number) {
  const blob = await fetchTableQrBlob(tableId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `table-${tableNumber}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchAllOrders() {
  const batches = await Promise.all(
    ORDER_STATUSES.map((status) => api<ManagerOrder[]>(`/orders?status=${status}`)),
  );
  const merged = batches.flat();
  const seen = new Set<number>();
  return merged
    .filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function fetchInvoices(search?: string) {
  const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return api<Invoice[]>(`/billing${q}`);
}

export async function downloadBillingExport() {
  const token = getToken();
  const res = await fetch(`${BASE}/billing/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoices.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(invoiceId: number) {
  const token = getToken();
  const res = await fetch(`${BASE}/billing/${invoiceId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'PDF download failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function fetchStaff() {
  return api<StaffUser[]>('/users');
}

export function createStaff(data: { email: string; role: string; password: string }) {
  return api<StaffUser>('/users', { method: 'POST', body: JSON.stringify(data) });
}

export function removeStaff(id: number) {
  return api<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' });
}

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export type TimeBucket = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export type RevenueTrendPoint = {
  label: string;
  value: number;
  sublabel?: string;
};

export type DashboardStats = {
  revenueToday: number;
  ordersToday: number;
  aovToday: number;
  revenueYesterday: number;
  ordersYesterday: number;
  aovYesterday: number;
  buckets: Record<TimeBucket, number>;
  topItems: { name: string; quantity: number }[];
  dailyTrend: RevenueTrendPoint[];
  weeklyTrend: RevenueTrendPoint[];
  insights: string[];
  peakBucket: TimeBucket | null;
};

const BUCKET_ORDER: TimeBucket[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(iso: string, ref: Date): boolean {
  return dayKey(new Date(iso)) === dayKey(ref);
}

function isYesterday(iso: string): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(iso, y);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function weekKey(d: Date): string {
  return dayKey(startOfWeek(d));
}

export function timeBucket(iso: string): TimeBucket {
  const hour = new Date(iso).getHours();
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function computeDashboardFromInvoices(invoices: Invoice[]): DashboardStats {
  const now = new Date();
  const todayInvoices = invoices.filter((inv) => isToday(inv.createdAt));
  const yesterdayInvoices = invoices.filter((inv) => isYesterday(inv.createdAt));

  const revenueToday = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const ordersToday = todayInvoices.length;
  const revenueYesterday = yesterdayInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const ordersYesterday = yesterdayInvoices.length;
  const aovToday = ordersToday > 0 ? revenueToday / ordersToday : 0;
  const aovYesterday = ordersYesterday > 0 ? revenueYesterday / ordersYesterday : 0;

  const buckets: Record<TimeBucket, number> = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0,
  };
  for (const inv of todayInvoices) {
    buckets[timeBucket(inv.createdAt)] += 1;
  }

  const peakBucket =
    BUCKET_ORDER.reduce<TimeBucket | null>((best, bucket) => {
      if (buckets[bucket] === 0) return best;
      if (!best || buckets[bucket] > buckets[best]) return bucket;
      return best;
    }, null) ?? null;

  const itemCounts = new Map<string, { name: string; quantity: number }>();
  for (const inv of invoices) {
    for (const line of inv.order.orderItems) {
      const key = String(line.menuItem.id);
      const existing = itemCounts.get(key);
      if (existing) {
        existing.quantity += line.quantity;
      } else {
        itemCounts.set(key, { name: line.menuItem.name, quantity: line.quantity });
      }
    }
  }
  const topItems = [...itemCounts.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  const dailyTrend: RevenueTrendPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const dayInvoices = invoices.filter((inv) => dayKey(new Date(inv.createdAt)) === key);
    const value = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);
    dailyTrend.push({
      label: i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' }),
      sublabel: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value,
    });
  }

  const weeklyTrend: RevenueTrendPoint[] = [];
  for (let i = 3; i >= 0; i -= 1) {
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const wKey = weekKey(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekInvoices = invoices.filter((inv) => weekKey(new Date(inv.createdAt)) === wKey);
    const value = weekInvoices.reduce((sum, inv) => sum + inv.total, 0);
    weeklyTrend.push({
      label: i === 0 ? 'This wk' : `Wk −${i}`,
      sublabel: `${weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
      value,
    });
  }

  const insights: string[] = [];
  if (ordersToday === 0) {
    insights.push('No served orders yet today — revenue will appear once orders are completed and invoiced.');
  } else {
    insights.push(
      `Today's revenue is ${formatCurrency(revenueToday)} across ${ordersToday} served order${ordersToday === 1 ? '' : 's'}.`,
    );
    if (peakBucket) {
      insights.push(`${peakBucket} is your busiest period today with ${buckets[peakBucket]} order${buckets[peakBucket] === 1 ? '' : 's'}.`);
    }
    if (topItems[0]) {
      insights.push(`${topItems[0].name} is your top seller (${topItems[0].quantity} units served all-time).`);
    }
    if (aovToday > 0) {
      insights.push(`Average order value today is ${formatCurrency(aovToday)}.`);
    }
  }

  return {
    revenueToday,
    ordersToday,
    aovToday,
    revenueYesterday,
    ordersYesterday,
    aovYesterday,
    buckets,
    topItems,
    dailyTrend,
    weeklyTrend,
    insights,
    peakBucket,
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}
