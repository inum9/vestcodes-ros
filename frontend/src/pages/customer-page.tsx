import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  cartCount,
  cartSubtotal,
  clearCart,
  loadCart,
  saveCart,
  type CartLine,
} from '../lib/cart-storage';
import {
  createOrder,
  fetchActiveOrder,
  fetchMenu,
  verifyTable,
  type MenuItem,
} from '../lib/customer-api';

type PageState = 'loading' | 'invalid' | 'ready' | 'submitting' | 'confirmed';

function groupByCategory(items: MenuItem[]) {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
}

export default function CustomerPage() {
  const { tableId: tableIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') ?? '';
  const tableId = Number(tableIdParam);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrderWarning, setActiveOrderWarning] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');

  const groupedMenu = useMemo(() => groupByCategory(menu), [menu]);
  const itemCount = cartCount(cart);
  const subtotal = cartSubtotal(cart);

  useEffect(() => {
    async function init() {
      if (!tableId || Number.isNaN(tableId) || !token) {
        setPageState('invalid');
        setError('This table link is invalid. Please scan the QR code at your table again.');
        return;
      }

      try {
        const verified = await verifyTable(tableId, token);
        setTableNumber(verified.tableNumber);
        setRestaurantName(verified.restaurantName);
        setCurrency(verified.currency);

        const menuItems = await fetchMenu(verified.restaurantId);
        setMenu(menuItems);
        setCart(loadCart(tableId));

        try {
          const activeOrder = await fetchActiveOrder(tableId, token);
          if (activeOrder.hasActiveOrder && activeOrder.order) {
            setActiveOrderWarning(
              `Order #${activeOrder.order.id} is already ${activeOrder.order.status}. You can place a new order once it is completed.`,
            );
          }
        } catch {
          // Non-fatal — menu still loads if active-order check fails
        }

        setPageState('ready');
      } catch (err) {
        setPageState('invalid');
        setError(
          err instanceof Error
            ? err.message
            : 'This table link is invalid. Please scan the QR code at your table again.',
        );
      }
    }

    init();
  }, [tableId, token]);

  function updateCart(next: CartLine[]) {
    setCart(next);
    saveCart(tableId, next);
  }

  function addItem(item: MenuItem) {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      updateCart(
        cart.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      updateCart([
        ...cart,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  }

  function removeItem(menuItemId: number) {
    const existing = cart.find((c) => c.menuItemId === menuItemId);
    if (!existing) return;

    if (existing.quantity <= 1) {
      updateCart(cart.filter((c) => c.menuItemId !== menuItemId));
    } else {
      updateCart(
        cart.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c,
        ),
      );
    }
  }

  async function handleConfirmOrder() {
    if (cart.length === 0) return;

    setSubmitError('');
    setPageState('submitting');

    try {
      const result = await createOrder({
        tableId,
        token,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
        })),
      });

      clearCart(tableId);
      setCart([]);
      setCartOpen(false);
      setConfirmedOrderId(result.id);
      setPageState('confirmed');
    } catch (err) {
      setPageState('ready');
      setSubmitError(err instanceof Error ? err.message : 'Could not place order');
    }
  }

  if (pageState === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-background px-4">
        <p className="text-sm text-app-text-secondary">Loading your table menu…</p>
      </main>
    );
  }

  if (pageState === 'invalid') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-background px-4">
        <div className="max-w-md rounded-3xl border border-app-border bg-app-card p-6 text-center shadow-card">
          <h1 className="text-xl font-semibold text-app-text-title">Invalid table link</h1>
          <p className="mt-2 text-sm text-app-text-secondary">{error}</p>
        </div>
      </main>
    );
  }

  if (pageState === 'confirmed' && confirmedOrderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-background px-4">
        <div className="max-w-md rounded-3xl border border-app-border bg-app-card p-6 text-center shadow-card">
          <h1 className="text-2xl font-semibold text-app-text-title">Order placed!</h1>
          <p className="mt-2 text-sm text-app-text-secondary">
            Your order ID is <span className="font-semibold text-primary-dark">#{confirmedOrderId}</span>
          </p>
          <p className="mt-1 text-sm text-app-text-muted">
            {restaurantName} · Table {tableNumber}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app-background pb-24">
      <header className="sticky top-0 z-10 border-b border-app-border bg-app-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-app-text-muted">{restaurantName}</p>
            <h1 className="text-lg font-semibold text-app-text-title">Table {tableNumber}</h1>
          </div>
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
            QR locked
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4">
        {activeOrderWarning && (
          <div className="mb-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
            {activeOrderWarning}
          </div>
        )}

        {Object.entries(groupedMenu).map(([category, items]) => (
          <section key={category} className="mb-6">
            <h2 className="mb-3 text-base font-semibold text-app-text-title">{category}</h2>
            <div className="space-y-3">
              {items.map((item) => {
                const qty = cart.find((c) => c.menuItemId === item.id)?.quantity ?? 0;
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-app-border bg-app-card p-4 shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-app-text-primary">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-app-text-secondary">{item.description}</p>
                        )}
                        <p className="mt-2 text-sm font-semibold text-primary-dark">
                          {currency === 'INR' ? '₹' : ''}{item.price}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={qty === 0}
                          className="h-8 w-8 rounded-full border border-app-border text-lg disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => addItem(item)}
                          className="h-8 w-8 rounded-full bg-primary text-lg text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card"
        >
          View cart ({itemCount})
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/30">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-app-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-app-text-title">Your cart</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="text-sm text-app-text-secondary"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-app-text-primary">{item.name}</p>
                    <p className="text-xs text-app-text-muted">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {currency === 'INR' ? '₹' : ''}{item.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-app-border pt-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>Subtotal</span>
                <span>{currency === 'INR' ? '₹' : ''}{subtotal}</span>
              </div>
            </div>

            {submitError && (
              <p className="mt-3 rounded-xl bg-warning-light px-3 py-2 text-sm text-warning-dark">
                {submitError}
              </p>
            )}

            <button
              type="button"
              disabled={pageState === 'submitting'}
              onClick={handleConfirmOrder}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pageState === 'submitting' ? 'Placing order…' : 'Confirm order'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}