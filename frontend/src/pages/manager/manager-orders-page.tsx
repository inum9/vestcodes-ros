import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../components/status-badge';
import {
  fetchAllOrders,
  formatCurrency,
  formatDateTime,
  type ManagerOrder,
} from '../../lib/manager-api';

function orderItemsSummary(order: ManagerOrder) {
  return order.orderItems.map((line) => `${line.quantity}× ${line.menuItem.name}`).join(', ');
}

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        setOrders(await fetchAllOrders());
      } catch {
        setError('Could not load orders.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return orders;
    const lower = q.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).includes(q) ||
        String(o.table.number).includes(q) ||
        o.status.toLowerCase().includes(lower),
    );
  }, [orders, search]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-app-text-title">Orders</h1>
      <p className="mt-1 text-sm text-app-text-secondary">All orders across every status.</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
          {error}
        </div>
      )}

      <input
        type="search"
        placeholder="Search by order ID or table number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full max-w-md rounded-xl border border-app-border px-3 py-2 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-app-border bg-app-card shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-app-border bg-app-surface text-xs uppercase text-app-text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-app-text-secondary">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b border-app-border last:border-0">
                  <td className="px-4 py-3 font-medium text-app-text-title">#{order.id}</td>
                  <td className="px-4 py-3">{order.table.number}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-app-text-secondary">
                    {orderItemsSummary(order)}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-app-text-muted">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
