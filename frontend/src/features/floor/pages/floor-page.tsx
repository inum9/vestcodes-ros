import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, ResponsiveBoard, ResponsiveBoardColumn } from '@/components/shared/responsive-shell';
import { clearAuth, getUser } from '@/lib/auth';
import {
  approveOrder,
  fetchOrdersByStatus,
  formatTime,
  minutesSince,
  orderItemsSummary,
  rejectOrder,
  serveOrder,
  type FloorOrder,
} from '@/lib/floor-api';
import { useOrdersSocket } from '@/hooks/use-orders-socket';

function splitOrders(orders: FloorOrder[]) {
  return {
    pending: orders.filter((o) => o.status === 'pending'),
    ready: orders.filter((o) => o.status === 'ready'),
  };
}

function notifyNewOrder(tableNumber: number) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('New incoming order', {
      body: `Table ${tableNumber} placed an order`,
    });
  }
}

function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // optional audio
  }
}

function FloorOrderCard({
  order,
  children,
}: {
  order: FloorOrder;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-app-border bg-app-card p-4 shadow-soft transition-shadow hover:shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Order #{order.id}</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-app-text-title sm:text-3xl">
            Table {order.table.number}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-app-text-secondary sm:text-base">
            {orderItemsSummary(order)}
          </p>
        </div>
      </div>
      {children}
    </article>
  );
}

function FloorColumn({
  title,
  count,
  accent,
  children,
  emptyTitle,
  emptyHint,
  loading,
}: {
  title: string;
  count: number;
  accent: 'warning' | 'success';
  children: ReactNode;
  emptyTitle: string;
  emptyHint: string;
  loading?: boolean;
}) {
  const accentClass =
    accent === 'warning'
      ? 'border-warning/30 bg-warning-light/40'
      : 'border-success/30 bg-success-light/40';

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-3xl border border-app-border bg-app-card/90 shadow-soft sm:min-h-[400px]">
      <header className={`flex items-center justify-between gap-3 rounded-t-3xl border-b px-4 py-4 sm:px-5 ${accentClass}`}>
        <h2 className="text-lg font-bold text-app-text-title sm:text-xl">{title}</h2>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-sm font-bold tabular-nums">{count}</span>
      </header>
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-app-text-secondary">Loading orders…</p>
        ) : count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-app-border px-4 py-10 text-center">
            <p className="font-semibold text-app-text-secondary">{emptyTitle}</p>
            <p className="mt-1 text-xs text-app-text-muted">{emptyHint}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default function FloorPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [pending, setPending] = useState<FloorOrder[]>([]);
  const [ready, setReady] = useState<FloorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const notifiedOrders = useRef(new Set<number>());

  const applySnapshot = useCallback((orders: FloorOrder[]) => {
    const { pending: p, ready: r } = splitOrders(orders);
    setPending(p);
    setReady(r);
  }, []);

  const refreshLists = useCallback(async () => {
    const [p, r] = await Promise.all([fetchOrdersByStatus('pending'), fetchOrdersByStatus('ready')]);
    setPending(p);
    setReady(r);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        await refreshLists();
      } catch {
        setError('Could not load orders. Check backend connection.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [refreshLists]);

  const { connected } = useOrdersSocket(applySnapshot, {
    onOrderCreated: (order) => {
      if (order.status !== 'pending') return;
      setPending((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      if (!notifiedOrders.current.has(order.id)) {
        notifiedOrders.current.add(order.id);
        notifyNewOrder(order.table.number);
        playAlertTone();
      }
    },
    onOrderUpdated: () => {
      void refreshLists();
    },
  });

  const pendingSorted = useMemo(
    () => [...pending].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [pending],
  );

  const readySorted = useMemo(
    () => [...ready].sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
    [ready],
  );

  async function runAction(id: number, action: () => Promise<unknown>) {
    setBusyId(id);
    setError('');
    try {
      await action();
      await refreshLists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <main className="min-h-screen bg-app-background page-x page-y pb-10 safe-bottom">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow="Floor staff"
          title="Incoming & delivery"
          description={`Signed in as ${user?.email ?? ''}`}
          actions={
            <>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  connected ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
                }`}
              >
                {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {connected ? 'Live' : 'Reconnecting'}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleLogout} className="rounded-xl">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </>
          }
        />

        {!connected && (
          <div className="rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
            WebSocket disconnected — showing last loaded data. Reconnecting automatically…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
            {error}
          </div>
        )}

        <ResponsiveBoard columns={2}>
          <ResponsiveBoardColumn>
            <FloorColumn
              title="Incoming"
              count={pendingSorted.length}
              accent="warning"
              loading={loading}
              emptyTitle="No incoming orders"
              emptyHint="New customer orders appear here instantly"
            >
              {pendingSorted.map((order) => (
                <FloorOrderCard key={order.id} order={order}>
                  <p className="mt-3 text-xs text-app-text-muted sm:text-sm">
                    Received {formatTime(order.createdAt)} · {minutesSince(order.createdAt)}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => runAction(order.id, () => approveOrder(order.id))}
                      className="h-11 flex-1 rounded-xl text-sm font-semibold sm:h-12 sm:text-base"
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busyId === order.id}
                      onClick={() => runAction(order.id, () => rejectOrder(order.id))}
                      className="h-11 flex-1 rounded-xl text-sm font-semibold sm:h-12 sm:text-base"
                    >
                      Reject
                    </Button>
                  </div>
                </FloorOrderCard>
              ))}
            </FloorColumn>
          </ResponsiveBoardColumn>

          <ResponsiveBoardColumn>
            <FloorColumn
              title="Ready for delivery"
              count={readySorted.length}
              accent="success"
              loading={loading}
              emptyTitle="Nothing ready yet"
              emptyHint="Kitchen marks orders ready — pick up and serve here"
            >
              {readySorted.map((order) => (
                <FloorOrderCard key={order.id} order={order}>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-app-text-muted sm:text-sm">
                    <Bell className="h-3.5 w-3.5 shrink-0" />
                    Ready {formatTime(order.updatedAt)} · {minutesSince(order.updatedAt)}
                  </p>
                  <Button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => runAction(order.id, () => serveOrder(order.id))}
                    className="mt-4 h-11 w-full rounded-xl text-sm font-semibold sm:h-12 sm:text-base"
                  >
                    Mark served
                  </Button>
                </FloorOrderCard>
              ))}
            </FloorColumn>
          </ResponsiveBoardColumn>
        </ResponsiveBoard>
      </div>
    </main>
  );
}
