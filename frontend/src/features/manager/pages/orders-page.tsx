import { useEffect, useMemo, useState } from 'react';
import ManagerAlert from '@/features/manager/components/manager-alert';
import StatusBadge from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { PageHeader, ResponsiveTableShell } from '@/components/shared/responsive-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchAllOrders,
  formatCurrency,
  formatDateTime,
  type ManagerOrder,
} from '@/lib/manager-api';

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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Orders" description="All orders across every status." />

      {error && <ManagerAlert message={error} />}

      <Input
        type="search"
        placeholder="Search by order ID or table number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border-app-border sm:max-w-md"
      />

      <ResponsiveTableShell minWidth="720px">
        <Table>
          <TableHeader className="bg-app-surface">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Order</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Table</TableHead>
              <TableHead className="hidden px-4 py-3 text-xs uppercase text-app-text-muted sm:table-cell">
                Items
              </TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Total</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Status</TableHead>
              <TableHead className="hidden px-4 py-3 text-xs uppercase text-app-text-muted md:table-cell">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-6 text-app-text-secondary">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-4 py-3 font-medium text-app-text-title">#{order.id}</TableCell>
                  <TableCell className="px-4 py-3">{order.table.number}</TableCell>
                  <TableCell className="hidden max-w-xs truncate px-4 py-3 text-app-text-secondary sm:table-cell">
                    {orderItemsSummary(order)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3">{formatCurrency(order.total)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-app-text-muted md:table-cell">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ResponsiveTableShell>
    </div>
  );
}
