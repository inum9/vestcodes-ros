import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import KitchenKanbanColumn from '@/features/kitchen/components/kitchen-kanban-column';
import KitchenKpiStrip from '@/features/kitchen/components/kitchen-kpi-strip';
import KitchenOrderCard from '@/features/kitchen/components/kitchen-order-card';
import { ResponsiveBoard, ResponsiveBoardColumn } from '@/components/shared/responsive-shell';
import { Button } from '@/components/ui/button';
import { clearAuth, getUser } from '@/lib/auth';
import { sortKitchenFifo } from '@/lib/kitchen-display';
import { advanceOrder, fetchKitchenOrders, type KitchenOrder } from '@/lib/kitchen-api';
import {
  isKitchenMuted,
  setKitchenMuted,
  useKitchenOrdersSocket,
} from '@/hooks/use-kitchen-orders-socket';

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

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-lg font-bold tabular-nums text-app-text-title sm:text-xl">{time}</span>
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
  const [now, setNow] = useState(Date.now());
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

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

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

  const allOrders = useMemo(
    () => [...approved, ...preparing, ...ready],
    [approved, preparing, ready],
  );

  const approvedSorted = useMemo(() => sortKitchenFifo(approved), [approved]);
  const preparingSorted = useMemo(() => sortKitchenFifo(preparing), [preparing]);
  const readySorted = useMemo(() => sortKitchenFifo(ready), [ready]);

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
    <main className="min-h-screen bg-app-background page-x page-y pb-10 safe-bottom">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 rounded-2xl border border-app-border bg-gradient-to-br from-primary-light/60 via-app-card to-app-card p-4 shadow-soft sm:mb-6 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
                <ChefHat className="h-6 w-6 text-primary-dark" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-dark">
                  Kitchen display system
                </p>
                <h1 className="text-xl font-bold tracking-tight text-app-text-title sm:text-2xl">
                  Service board
                </h1>
                <p className="text-xs text-app-text-secondary sm:text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
              <LiveClock />
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold sm:px-3 ${
                  connected ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
                }`}
              >
                {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {connected ? 'Live' : 'Reconnecting'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleMute}
                className="rounded-xl border-app-border"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span className="hidden sm:inline">{muted ? 'Unmute' : 'Mute'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-xl border-app-border"
              >
                Log out
              </Button>
            </div>
          </div>
        </header>

        <div className="mb-5 sm:mb-6">
          <KitchenKpiStrip
            pending={approved.length}
            preparing={preparing.length}
            ready={ready.length}
            orders={allOrders}
            loading={loading}
            now={now}
          />
        </div>

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

        <ResponsiveBoard columns={3}>
          <ResponsiveBoardColumn>
            <KitchenKanbanColumn
              title="Pending"
              subtitle="Approved by floor — start cooking"
              count={approvedSorted.length}
              accent="warning"
              loading={loading}
              emptyTitle="No pending orders"
              emptyHint="New tickets appear here when floor approves them"
            >
              {approvedSorted.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  column="approved"
                  now={now}
                  busy={busyId === order.id}
                  onAction={() => void handleAdvance(order)}
                />
              ))}
            </KitchenKanbanColumn>
          </ResponsiveBoardColumn>

          <ResponsiveBoardColumn>
            <KitchenKanbanColumn
              title="Preparing"
              subtitle="On the line — mark ready when plated"
              count={preparingSorted.length}
              accent="primary"
              loading={loading}
              emptyTitle="Nothing on the line"
              emptyHint="Move pending tickets here to start the timer"
            >
              {preparingSorted.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  column="preparing"
                  now={now}
                  busy={busyId === order.id}
                  onAction={() => void handleAdvance(order)}
                />
              ))}
            </KitchenKanbanColumn>
          </ResponsiveBoardColumn>

          <ResponsiveBoardColumn>
            <KitchenKanbanColumn
              title="Ready"
              subtitle="Waiting for floor pickup"
              count={readySorted.length}
              accent="success"
              loading={loading}
              emptyTitle="No ready tickets"
              emptyHint="Completed dishes show here for service"
            >
              {readySorted.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  column="ready"
                  now={now}
                  fading={fadingIds.has(order.id)}
                />
              ))}
            </KitchenKanbanColumn>
          </ResponsiveBoardColumn>
        </ResponsiveBoard>
      </div>
    </main>
  );
}
