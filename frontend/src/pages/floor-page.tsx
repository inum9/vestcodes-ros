import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../lib/auth';
import {
  approveOrder,
  fetchOrdersByStatus,
  formatTime,
  minutesSince,
  orderItemsSummary,
  rejectOrder,
  serveOrder,
  type FloorOrder,
} from '../lib/floor-api';
import { useOrdersSocket } from '../lib/use-orders-socket';

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

function OrderCard({
  order,
  children,
}: {
  order: FloorOrder;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-app-border bg-app-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Order #{order.id}</p>
          <h3 className="mt-1 text-lg font-semibold text-app-text-title">Table {order.table.number}</h3>
          <p className="mt-2 text-sm text-app-text-secondary">{orderItemsSummary(order)}</p>
        </div>
        <div className="text-right text-xs text-app-text-muted">
          <p>₹{order.total}</p>
        </div>
      </div>
      {children}
    </article>
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
    () => [...pending].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [pending],
  );

  const readySorted = useMemo(
    () => [...ready].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
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
    <main className="min-h-screen bg-app-background px-4 py-6 pb-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-dark">Floor staff</p>
            <h1 className="text-2xl font-semibold text-app-text-title">Incoming & delivery</h1>
            <p className="mt-1 text-sm text-app-text-secondary">Signed in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                connected ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
              }`}
            >
              {connected ? 'Live updates' : 'Reconnecting…'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-primary hover:bg-app-surface"
            >
              Log out
            </button>
          </div>
        </header>

        {!connected && (
          <div className="mb-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
            WebSocket disconnected — showing last loaded data. Reconnecting automatically…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-app-text-title">Incoming orders</h2>
              <span className="text-xs text-app-text-muted">{pendingSorted.length} pending</span>
            </div>

            {loading ? (
              <p className="text-sm text-app-text-secondary">Loading orders…</p>
            ) : pendingSorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-app-border bg-app-card p-6 text-center">
                <p className="text-sm font-medium text-app-text-primary">No incoming orders</p>
                <p className="mt-1 text-xs text-app-text-muted">New customer orders will appear here instantly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSorted.map((order) => (
                  <OrderCard key={order.id} order={order}>
                    <p className="mt-3 text-xs text-app-text-muted">
                      Received {formatTime(order.createdAt)} · {minutesSince(order.createdAt)}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => runAction(order.id, () => approveOrder(order.id))}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => runAction(order.id, () => rejectOrder(order.id))}
                        className="flex-1 rounded-xl border border-app-border py-2.5 text-sm font-semibold text-app-text-primary hover:bg-app-surface disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </OrderCard>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-app-text-title">Ready for delivery</h2>
              <span className="text-xs text-app-text-muted">{readySorted.length} ready</span>
            </div>

            {loading ? (
              <p className="text-sm text-app-text-secondary">Loading orders…</p>
            ) : readySorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-app-border bg-app-card p-6 text-center">
                <p className="text-sm font-medium text-app-text-primary">No orders ready for delivery</p>
                <p className="mt-1 text-xs text-app-text-muted">Orders marked ready by kitchen will show here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readySorted.map((order) => (
                  <OrderCard key={order.id} order={order}>
                    <p className="mt-3 text-xs text-app-text-muted">
                      Ready since {formatTime(order.updatedAt)} · {minutesSince(order.updatedAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => runAction(order.id, () => serveOrder(order.id))}
                      className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      Mark served
                    </button>
                  </OrderCard>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
