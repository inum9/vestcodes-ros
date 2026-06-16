import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QrPreview from '@/components/qr-preview';
import { Button } from '@/components/ui/button';
import {
  computeDashboardFromInvoices,
  downloadTableQr,
  fetchInvoices,
  fetchTables,
  formatCurrency,
  type RestaurantTable,
  type TimeBucket,
} from '../../lib/manager-api';
const BUCKET_ORDER: TimeBucket[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
const REFRESH_MS = 30_000;

export default function ManagerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueToday, setRevenueToday] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [buckets, setBuckets] = useState<Record<TimeBucket, number>>({
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0,
  });
  const [topItems, setTopItems] = useState<{ name: string; quantity: number }[]>([]);
  const [maxBucket, setMaxBucket] = useState(1);
  const [maxTopQty, setMaxTopQty] = useState(1);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState('');
  const [downloadingTableId, setDownloadingTableId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const invoices = await fetchInvoices();
      const stats = computeDashboardFromInvoices(invoices);
      setRevenueToday(stats.revenueToday);
      setOrdersToday(stats.ordersToday);
      setBuckets(stats.buckets);
      setTopItems(stats.topItems);
      setMaxBucket(Math.max(1, ...Object.values(stats.buckets)));
      setMaxTopQty(Math.max(1, ...stats.topItems.map((i) => i.quantity)));
      setError('');
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTables = useCallback(async () => {
    setTablesLoading(true);
    setTablesError('');
    try {
      setTables(await fetchTables());
    } catch (err) {
      setTables([]);
      setTablesError(
        err instanceof Error ? err.message : 'Could not load tables. Log in as manager with backend running.',
      );
    } finally {
      setTablesLoading(false);
    }
  }, []);

  async function handleDownloadQr(table: RestaurantTable) {
    setDownloadingTableId(table.id);
    try {
      await downloadTableQr(table.id, table.number);
    } catch {
      setError('Could not download QR code.');
    } finally {
      setDownloadingTableId(null);
    }
  }

  useEffect(() => {
    void load();
    void loadTables();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load, loadTables]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-app-text-title">Dashboard</h1>
      <p className="mt-1 text-sm text-app-text-secondary">
        KPIs from served orders (invoices). Refreshes every 30 seconds.
      </p>

      {error && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">Revenue today</p>
          <p className="mt-2 text-3xl font-semibold text-app-text-title">
            {loading ? '…' : formatCurrency(revenueToday)}
          </p>
        </div>
        <div className="rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">Orders today</p>
          <p className="mt-2 text-3xl font-semibold text-app-text-title">{loading ? '…' : ordersToday}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-app-text-title">Table QR codes</h2>
            <p className="mt-1 text-sm text-app-text-secondary">
              Scan or print for customer ordering at each table.
            </p>
          </div>
          <Link
            to="/manager/qr"
            className="text-sm font-medium text-primary-dark hover:underline"
          >
            Full QR page →
          </Link>
        </div>

        {tablesError && (
          <div className="mb-4 rounded-xl border border-warning/40 bg-warning-light px-3 py-2 text-sm text-warning-dark">
            {tablesError}
          </div>
        )}

        {tablesLoading ? (
          <p className="text-sm text-app-text-secondary">Loading QR codes…</p>
        ) : tables.length === 0 ? (
          <p className="text-sm text-app-text-secondary">
            No tables found. Run <code className="text-xs">pnpm db:seed</code> and ensure backend is on port 3000.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {tables.map((table) => (
              <article
                key={table.id}
                className="rounded-xl border border-app-border bg-app-surface/50 p-3 text-center"
              >
                <p className="text-sm font-semibold text-app-text-title">Table {table.number}</p>
                {table.zone && (
                  <p className="text-xs text-app-text-muted">{table.zone}</p>
                )}
                <div className="my-2">
                  <QrPreview tableId={table.id} size="sm" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={downloadingTableId === table.id}
                  onClick={() => void handleDownloadQr(table)}
                  className="w-full rounded-lg text-xs"
                >
                  {downloadingTableId === table.id ? '…' : 'Download PNG'}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
          <h2 className="text-base font-semibold text-app-text-title">Orders by time of day (today)</h2>
          {loading ? (
            <p className="mt-4 text-sm text-app-text-secondary">Loading…</p>
          ) : (
            <div className="mt-4 space-y-3">
              {BUCKET_ORDER.map((bucket) => (
                <div key={bucket}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-app-text-primary">{bucket}</span>
                    <span className="font-medium text-app-text-title">{buckets[bucket]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-app-surface">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(buckets[bucket] / maxBucket) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
          <h2 className="text-base font-semibold text-app-text-title">Top items (all time, served)</h2>
          {loading ? (
            <p className="mt-4 text-sm text-app-text-secondary">Loading…</p>
          ) : topItems.length === 0 ? (
            <p className="mt-4 text-sm text-app-text-secondary">No served orders yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topItems.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate text-app-text-primary">{item.name}</span>
                    <span className="ml-2 font-medium text-app-text-title">{item.quantity}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-app-surface">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${(item.quantity / maxTopQty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-app-text-title">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { to: '/manager/menu', label: 'Menu' },
            { to: '/manager/qr', label: 'QR Codes' },
            { to: '/manager/orders', label: 'Orders' },
            { to: '/manager/billing', label: 'Billing' },
            { to: '/manager/users', label: 'Users' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-primary hover:bg-app-surface"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
