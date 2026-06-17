import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import ManagerAlert from '@/features/manager/components/manager-alert';
import BusinessSummaryCard from '@/features/manager/components/business-summary-card';
import DashboardHeader from '@/features/manager/components/dashboard-header';
import { KpiCard, KpiGridSkeleton } from '@/features/manager/components/dashboard-kpi-card';
import QrCompactSection from '@/features/manager/components/qr-compact-section';
import RevenueTrendChart from '@/features/manager/components/revenue-trend-chart';
import TimeOfDayChart from '@/features/manager/components/time-of-day-chart';
import TopSellersChart from '@/features/manager/components/top-sellers-chart';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getUser } from '@/lib/auth';
import {
  computeDashboardFromInvoices,
  downloadTableQr,
  fetchInvoices,
  fetchTables,
  formatCurrency,
  percentChange,
  type DashboardStats,
  type RestaurantTable,
} from '@/lib/manager-api';

const REFRESH_MS = 30_000;

const QUICK_LINKS = [
  { to: '/manager/menu', label: 'Menu' },
  { to: '/manager/orders', label: 'Orders' },
  { to: '/manager/billing', label: 'Billing' },
  { to: '/manager/users', label: 'Users' },
];

const EMPTY_STATS: DashboardStats = {
  revenueToday: 0,
  ordersToday: 0,
  aovToday: 0,
  revenueYesterday: 0,
  ordersYesterday: 0,
  aovYesterday: 0,
  buckets: { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 },
  topItems: [],
  dailyTrend: [],
  weeklyTrend: [],
  insights: [],
  peakBucket: null,
};

export default function ManagerDashboardPage() {
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState('');
  const [downloadingTableId, setDownloadingTableId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const invoices = await fetchInvoices();
      setStats(computeDashboardFromInvoices(invoices));
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
        err instanceof Error ? err.message : 'Could not load tables.',
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

  const revenueTrend = percentChange(stats.revenueToday, stats.revenueYesterday);
  const ordersTrend = percentChange(stats.ordersToday, stats.ordersYesterday);
  const aovTrend = percentChange(stats.aovToday, stats.aovYesterday);

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8">
      <DashboardHeader managerEmail={user?.email} />

      {error && <ManagerAlert message={error} />}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Overview</h2>
            <p className="mt-0.5 text-xs text-app-text-muted">Auto-refreshes every 30 seconds</p>
          </div>
        </div>

        {loading ? (
          <KpiGridSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Revenue today"
              value={formatCurrency(stats.revenueToday)}
              icon={IndianRupee}
              trend={revenueTrend}
              accent="primary"
            />
            <KpiCard
              label="Orders today"
              value={String(stats.ordersToday)}
              icon={ShoppingBag}
              trend={ordersTrend}
              accent="success"
            />
            <KpiCard
              label="Avg order value"
              value={stats.ordersToday > 0 ? formatCurrency(stats.aovToday) : '—'}
              icon={TrendingUp}
              trend={aovTrend}
              accent="warning"
            />
            <KpiCard
              label="Busiest period"
              value={stats.peakBucket ?? '—'}
              icon={Clock}
              trend={null}
              trendLabel={
                stats.peakBucket
                  ? `${stats.buckets[stats.peakBucket]} order${stats.buckets[stats.peakBucket] === 1 ? '' : 's'} today`
                  : 'No orders yet today'
              }
              accent="success"
            />
          </div>
        )}
      </section>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RevenueTrendChart
            daily={stats.dailyTrend}
            weekly={stats.weeklyTrend}
            loading={loading}
          />
        </div>
        <BusinessSummaryCard insights={stats.insights} loading={loading} />
      </div>

      <Separator className="bg-app-border/80" />

      <div className="grid gap-6 lg:grid-cols-2">
        <TimeOfDayChart
          buckets={stats.buckets}
          peakBucket={stats.peakBucket}
          loading={loading}
        />
        <TopSellersChart items={stats.topItems} loading={loading} />
      </div>

      <QrCompactSection
        tables={tables}
        loading={tablesLoading}
        error={tablesError}
        downloadingTableId={downloadingTableId}
        onDownload={(table) => void handleDownloadQr(table)}
      />

      <section className="rounded-2xl border border-app-border bg-app-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">Quick navigation</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_LINKS.map(({ to, label }) => (
            <Button
              key={to}
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-app-border bg-app-surface/50 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-light/50 hover:shadow-soft"
            >
              <Link to={to}>
                {label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ))}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-app-border bg-app-surface/50"
          >
            <Link to="/manager/qr">QR Codes</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
