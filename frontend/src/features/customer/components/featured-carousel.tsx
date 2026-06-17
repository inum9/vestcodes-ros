import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useRef } from 'react';
import MenuCard from '@/features/customer/components/menu-card';
import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/lib/customer-api';
import type { CartLine } from '@/lib/cart-storage';
import { cn } from '@/lib/utils';

type FeaturedCarouselProps = {
  items: MenuItem[];
  cart: CartLine[];
  currency: string;
  onAdd: (item: MenuItem) => void;
  onRemove: (menuItemId: number) => void;
  className?: string;
};

export default function FeaturedCarousel({
  items,
  cart,
  currency,
  onAdd,
  onRemove,
  className,
}: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 'left' | 'right') {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  }

  if (items.length === 0) return null;

  return (
    <section className={cn('mb-8', className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary-dark">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Chef&apos;s Special</span>
          </div>
          <h2 className="text-xl font-semibold text-app-text-title">Featured dishes</h2>
          <p className="mt-0.5 text-sm text-app-text-secondary">Handpicked favourites from our kitchen</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollBy('left')}
            className="h-9 w-9 rounded-full border-app-border bg-app-card shadow-soft"
            aria-label="Scroll featured dishes left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollBy('right')}
            className="h-9 w-9 rounded-full border-app-border bg-app-card shadow-soft"
            aria-label="Scroll featured dishes right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-0 sm:px-0"
      >
        {items.map((item) => {
          const qty = cart.find((c) => c.menuItemId === item.id)?.quantity ?? 0;
          return (
            <div
              key={item.id}
              className="w-[min(82vw,300px)] shrink-0 snap-start sm:w-[280px]"
            >
              <MenuCard
                item={item}
                quantity={qty}
                currency={currency}
                onAdd={() => onAdd(item)}
                onRemove={() => onRemove(item.id)}
                variant="compact"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
