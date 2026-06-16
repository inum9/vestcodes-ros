import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../lib/auth';
import {
  advanceOrder,
  fetchKitchenOrders,
  formatTime,
  minutesSince,
  orderItemsSummary,
  type KitchenOrder,
} from '../lib/kitchen-api';
import {
  isKitchenMuted,
  setKitchenMuted,
  useKitchenOrdersSocket,
} from '../lib/use-kitchen-orders-socket';

const FADING_SERVED_MS = 2500;

function splitKitchenOrders(orders: KitchenOrder[]) {
  return {
    approved: orders.filter((o) => o.status === 'approved'),
    preparing: orders.filter((o) => o.status === 'preparing'),
    ready: orders.filter((o) => o.status === 'ready'),
  };
}

function playChime() {
  if (isKitchenMuted()) return;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.value = 0.07;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // optional
  }
}

function KitchenCard({ order, children }: { order: KitchenOrder; children?: ReactNode }) {
  return (
    <article className="rounded-2xl border border-app-border bg-app-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Order #{order.id}</p>
          <h3 className="mt-1 text-lg font-semibold text-app-text-title">Table {order.table.number}</h3>
          <p className="mt-2 text-sm text-app-text-secondary">{orderItemsSummary(order)}</p>
        </div>
        <p className="text-xs font-semibold text-app-text-title">₹{order.total}</p>
      </div>
      {children}
    </article>
  );
}

export default function KitchenPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [approved, setApproved] = useState<KitchenOrder[]>([]);
  const [preparing, setPreparing] = useState<KitchenOrder[]>([]);
  const [ready, setReady] = useState<KitchenOrder[]>([]);
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [muted, setMuted] = useState(isKitchenMuted());
  const notifiedApproved = useRef(new Set<number>());

  const applySnapshot = useCallback((orders: KitchenOrder[]) => {
    const split = splitKitchenOrders(orders);
    setApproved(split.approved);
    setPreparing(split.preparing);
    setReady(split.ready);
  }, []);

  const refreshBoard = useCallback(async () => {
    const [a, p, r] = await Promise.all([
      fetchKitchenOrders('approved'),
      fetchKitchenOrders('preparing'),
      fetchKitchenOrders('ready'),
    ]);
    setApproved(a);
    setPreparing(p);
    setReady(r);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        await refreshBoard();
      } catch {
        setError('Could not load kitchen board. Check backend connection.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [refreshBoard]);

  const markServedFade = useCallback((orderId: number) => {
    setFadingIds((prev) => new Set(prev).add(orderId));
    window.setTimeout(() => {
      setReady((prev) => prev.filter((o) => o.id !== orderId));
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, FADING_SERVED_MS);
  }, []);

  const { connected } = useKitchenOrdersSocket(applySnapshot, {
    onOrderCreated: (order) => {
      if (order.status !== 'approved') return;
      setApproved((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      if (!notifiedApproved.current.has(order.id)) {
        notifiedApproved.current.add(order.id);
        playChime();
      }
    },
    onOrderUpdated: (payload) => {
      if (payload.status === 'served') {
        markServedFade(payload.orderId);
        return;
      }
      void refreshBoard();
    },
  });

  const approvedSorted = useMemo(
    () => [...approved].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [approved],
  );
  const preparingSorted = useMemo(
    () => [...preparing].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [preparing],
  );
  const readySorted = useMemo(
    () => [...ready].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [ready],
  );

  async function handleAdvance(order: KitchenOrder) {
    setBusyId(order.id);
    setError('');
    try {
      await advanceOrder(order.id);
      await refreshBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not advance order');
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setKitchenMuted(next);
  }

  return (
    <main className="min-h-screen bg-app-background px-4 py-6 pb-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-dark">Kitchen display</p>
            <h1 className="text-2xl font-semibold text-app-text-title">KDS board</h1>
            <p className="mt-1 text-sm text-app-text-secondary">Signed in as {user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                connected ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
              }`}
            >
              {connected ? 'Live updates' : 'Reconnecting…'}
            </span>
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-xl border border-app-border px-3 py-2 text-sm font-medium text-app-text-primary hover:bg-app-surface"
            >
              {muted ? 'Unmute chime' : 'Mute chime'}
            </button>
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
            WebSocket disconnected — showing last loaded board. Reconnecting automatically…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-3xl border border-app-border bg-app-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-app-text-title">To Do</h2>
              <span className="text-xs text-app-text-muted">{approvedSorted.length} approved</span>
            </div>
            <p className="mb-3 text-xs text-app-text-secondary">Start preparing when floor sends orders here.</p>
            {loading ? (
              <p className="text-sm text-app-text-secondary">Loading…</p>
            ) : approvedSorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-app-border p-6 text-center">
                <p className="text-sm font-medium text-app-text-primary">No approved orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedSorted.map((order) => (
                  <KitchenCard key={order.id} order={order}>
                    <p className="mt-3 text-xs text-app-text-muted">
                      Approved {formatTime(order.updatedAt)} · {minutesSince(order.updatedAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => handleAdvance(order)}
                      className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      {busyId === order.id ? 'Starting…' : 'Start preparing'}
                    </button>
                  </KitchenCard>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-app-border bg-app-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-app-text-title">In progress</h2>
              <span className="text-xs text-app-text-muted">{preparingSorted.length} preparing</span>
            </div>
            {loading ? (
              <p className="text-sm text-app-text-secondary">Loading…</p>
            ) : preparingSorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-app-border p-6 text-center">
                <p className="text-sm font-medium text-app-text-primary">Nothing cooking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {preparingSorted.map((order) => (
                  <KitchenCard key={order.id} order={order}>
                    <p className="mt-3 text-xs text-app-text-muted">
                      Cooking since {formatTime(order.updatedAt)} · {minutesSince(order.updatedAt)}
                    </p>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => handleAdvance(order)}
                      className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      {busyId === order.id ? 'Updating…' : 'Mark ready'}
                    </button>
                  </KitchenCard>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-app-border bg-app-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-app-text-title">Done</h2>
              <span className="text-xs text-app-text-muted">{readySorted.length} ready</span>
            </div>
            <p className="mb-3 text-xs text-app-text-secondary">Floor picks up from here — no kitchen action.</p>
            {loading ? (
              <p className="text-sm text-app-text-secondary">Loading…</p>
            ) : readySorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-app-border p-6 text-center">
                <p className="text-sm font-medium text-app-text-primary">No ready orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readySorted.map((order) => {
                  const fading = fadingIds.has(order.id);
                  return (
                    <KitchenCard key={order.id} order={order}>
                      <p className="mt-3 text-xs text-app-text-muted">
                        Ready since {formatTime(order.updatedAt)} · {minutesSince(order.updatedAt)}
                      </p>
                      <p
                        className={`mt-3 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-xs font-medium text-app-text-secondary ${
                          fading ? 'opacity-40' : ''
                        }`}
                      >
                        Waiting for floor to mark served
                      </p>
                    </KitchenCard>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
