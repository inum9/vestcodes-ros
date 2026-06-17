import { useCallback, useEffect, useMemo, useState } from 'react';

import { Search, ShoppingBag } from 'lucide-react';

import { useParams, useSearchParams } from 'react-router-dom';

import CategoryNav, { scrollToCategory } from '@/features/customer/components/category-nav';
import FeaturedCarousel from '@/features/customer/components/featured-carousel';
import MenuCard from '@/features/customer/components/menu-card';
import MenuLoading from '@/features/customer/components/menu-loading';
import OrderSuccessScreen from '@/features/customer/components/order-success-screen';
import RestaurantHeroHeader from '@/features/customer/components/restaurant-hero-header';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import {
  cartCount,
  cartSubtotal,
  clearCart,
  loadCart,
  saveCart,
  type CartLine,
} from '@/lib/cart-storage';

import {
  createOrder,
  fetchActiveOrder,
  fetchMenu,
  verifyTable,
  type MenuItem,
} from '@/lib/customer-api';

import {
  categorySlug,
  filterMenuItems,
  formatMenuPrice,
  getFeaturedItems,
  groupByCategory,
} from '@/lib/menu-display';



type PageState = 'loading' | 'invalid' | 'ready' | 'submitting' | 'confirmed';



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
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState(0);
  const [confirmedItemCount, setConfirmedItemCount] = useState(0);

  const [submitError, setSubmitError] = useState('');

  const [search, setSearch] = useState('');

  const [activeCategory, setActiveCategory] = useState('All');



  const filteredMenu = useMemo(() => filterMenuItems(menu, search), [menu, search]);

  const categories = useMemo(() => Object.keys(groupByCategory(menu)), [menu]);

  const groupedMenu = useMemo(() => groupByCategory(filteredMenu), [filteredMenu]);

  const featuredItems = useMemo(() => getFeaturedItems(filteredMenu), [filteredMenu]);

  const isSearching = search.trim().length > 0;

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



  useEffect(() => {

    if (isSearching || pageState !== 'ready') return;



    const sectionEls = categories

      .map((cat) => document.getElementById(`category-${categorySlug(cat)}`))

      .filter((el): el is HTMLElement => !!el);



    if (sectionEls.length === 0) return;



    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries

          .filter((e) => e.isIntersecting)

          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {

          const slug = visible[0].target.id.replace('category-', '');

          const cat = categories.find((c) => categorySlug(c) === slug);

          if (cat) setActiveCategory(cat);

        }

      },

      { rootMargin: '-150px 0px -55% 0px', threshold: [0, 0.15, 0.4] },

    );



    sectionEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();

  }, [categories, isSearching, pageState]);



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



  const handleCategorySelect = useCallback(

    (category: string) => {

      setActiveCategory(category);

      if (!isSearching) scrollToCategory(category);

    },

    [isSearching],

  );



  async function handleConfirmOrder() {

    if (cart.length === 0) return;



    setSubmitError('');

    setPageState('submitting');



    try {
      const placedItemCount = cartCount(cart);

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
      setConfirmedOrderTotal(result.total);
      setConfirmedItemCount(placedItemCount);
      setPageState('confirmed');

    } catch (err) {

      setPageState('ready');

      setSubmitError(err instanceof Error ? err.message : 'Could not place order');

    }

  }



  async function handleBackToMenu() {
    const orderId = confirmedOrderId;
    setConfirmedOrderId(null);
    setConfirmedOrderTotal(0);
    setConfirmedItemCount(0);
    setPageState('ready');

    if (orderId) {
      setActiveOrderWarning(
        `Order #${orderId} is being prepared. Browse the menu while you wait — new orders open once this one is served.`,
      );
    }

    try {
      const activeOrder = await fetchActiveOrder(tableId, token);
      if (activeOrder.hasActiveOrder && activeOrder.order) {
        setActiveOrderWarning(
          `Order #${activeOrder.order.id} is already ${activeOrder.order.status}. You can place a new order once it is completed.`,
        );
      }
    } catch {
      // Keep local warning if active-order check fails
    }
  }

  if (pageState === 'loading') {

    return <MenuLoading />;

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
      <OrderSuccessScreen
        orderId={confirmedOrderId}
        restaurantName={restaurantName}
        tableNumber={tableNumber!}
        total={confirmedOrderTotal}
        itemCount={confirmedItemCount}
        currency={currency}
        onBackToMenu={() => void handleBackToMenu()}
      />
    );
  }



  return (

    <main className="min-h-screen bg-app-background pb-28 safe-bottom">

      <RestaurantHeroHeader restaurantName={restaurantName} tableNumber={tableNumber!} />

      <div className="sticky top-0 z-20 border-b border-app-border bg-app-card/95 backdrop-blur">

        <div className="mx-auto max-w-5xl space-y-3 page-x py-3">

          <div className="relative">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />

            <Input

              type="search"

              placeholder="Search dishes, categories…"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              className="h-11 rounded-xl border-app-border bg-app-surface pl-10 text-base shadow-none focus-visible:ring-primary/30 md:text-sm"

            />

          </div>

          {!isSearching && (

            <CategoryNav

              categories={categories}

              activeCategory={activeCategory}

              onSelect={handleCategorySelect}

            />

          )}

        </div>

      </div>



      <div className="mx-auto max-w-5xl page-x py-6">

        {activeOrderWarning && (

          <div className="mb-6 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">

            {activeOrderWarning}

          </div>

        )}



        {!isSearching && featuredItems.length > 0 && (

          <FeaturedCarousel

            items={featuredItems}

            cart={cart}

            currency={currency}

            onAdd={addItem}

            onRemove={removeItem}

          />

        )}



        {filteredMenu.length === 0 ? (

          <div className="rounded-2xl border border-app-border bg-app-card px-6 py-12 text-center shadow-soft">

            <p className="text-base font-medium text-app-text-title">No dishes found</p>

            <p className="mt-1 text-sm text-app-text-secondary">

              Try a different search term or browse all categories.

            </p>

            {isSearching && (

              <Button

                type="button"

                variant="outline"

                className="mt-4 rounded-full"

                onClick={() => setSearch('')}

              >

                Clear search

              </Button>

            )}

          </div>

        ) : isSearching ? (

          <section>

            <h2 className="mb-4 text-lg font-semibold text-app-text-title">

              {filteredMenu.length} result{filteredMenu.length === 1 ? '' : 's'}

            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {filteredMenu.map((item) => {

                const qty = cart.find((c) => c.menuItemId === item.id)?.quantity ?? 0;

                return (

                  <MenuCard

                    key={item.id}

                    item={item}

                    quantity={qty}

                    currency={currency}

                    onAdd={() => addItem(item)}

                    onRemove={() => removeItem(item.id)}

                  />

                );

              })}

            </div>

          </section>

        ) : (

          Object.entries(groupedMenu).map(([category, items]) => (

            <section

              key={category}

              id={`category-${categorySlug(category)}`}

              className="mb-10 scroll-mt-36"

            >

              <div className="mb-4 flex items-baseline justify-between gap-2">

                <h2 className="text-xl font-semibold text-app-text-title">{category}</h2>

                <span className="text-sm text-app-text-muted">

                  {items.length} item{items.length === 1 ? '' : 's'}

                </span>

              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {items.map((item) => {

                  const qty = cart.find((c) => c.menuItemId === item.id)?.quantity ?? 0;

                  return (

                    <MenuCard

                      key={item.id}

                      item={item}

                      quantity={qty}

                      currency={currency}

                      onAdd={() => addItem(item)}

                      onRemove={() => removeItem(item.id)}

                    />

                  );

                })}

              </div>

            </section>

          ))

        )}

      </div>



      {itemCount > 0 && (

        <div className="fixed left-0 right-0 z-40 page-x pb-4 safe-bottom-fixed">

          <Button

            type="button"

            onClick={() => setCartOpen(true)}

            className="mx-auto flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-full shadow-card"

          >

            <ShoppingBag className="h-4 w-4" />

            View cart ({itemCount}) · {formatMenuPrice(subtotal, currency)}

          </Button>

        </div>

      )}



      {cartOpen && (

        <div className="fixed inset-0 z-50 flex items-end bg-black/30 backdrop-blur-[1px]">

          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-app-card p-5 shadow-card sm:mx-auto sm:max-w-lg">

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-lg font-semibold text-app-text-title">Your cart</h2>

              <Button

                type="button"

                variant="ghost"

                size="sm"

                onClick={() => setCartOpen(false)}

                className="text-app-text-secondary"

              >

                Close

              </Button>

            </div>



            <div className="space-y-4">

              {cart.map((item) => (

                <div key={item.menuItemId} className="flex items-center justify-between gap-3">

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-app-text-primary">{item.name}</p>

                    <p className="text-xs text-app-text-muted">Qty {item.quantity}</p>

                  </div>

                  <p className="shrink-0 text-sm font-semibold text-primary-dark">

                    {formatMenuPrice(item.price * item.quantity, currency)}

                  </p>

                </div>

              ))}

            </div>



            <div className="mt-4 border-t border-app-border pt-3">

              <div className="flex justify-between text-sm font-semibold text-app-text-title">

                <span>Subtotal</span>

                <span>{formatMenuPrice(subtotal, currency)}</span>

              </div>

            </div>



            {submitError && (

              <p className="mt-3 rounded-xl bg-warning-light px-3 py-2 text-sm text-warning-dark">

                {submitError}

              </p>

            )}



            <Button

              type="button"

              disabled={pageState === 'submitting'}

              onClick={handleConfirmOrder}

              className="mt-4 w-full rounded-2xl py-6 text-sm font-semibold"

            >

              {pageState === 'submitting' ? 'Placing order…' : 'Confirm order'}

            </Button>

          </div>

        </div>

      )}

    </main>

  );

}


