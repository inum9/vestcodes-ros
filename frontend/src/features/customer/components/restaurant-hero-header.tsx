import { Clock, MapPin, Star } from 'lucide-react';
import leafSprig from '@/assets/leaf-sprig.svg';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  getRestaurantBrand,
  isRestaurantOpen,
} from '@/lib/restaurant-brand';
import { cn } from '@/lib/utils';

type RestaurantHeroHeaderProps = {
  restaurantName: string;
  tableNumber: number;
  className?: string;
};

export default function RestaurantHeroHeader({
  restaurantName,
  tableNumber,
  className,
}: RestaurantHeroHeaderProps) {
  const brand = getRestaurantBrand(restaurantName);
  const open = isRestaurantOpen();

  return (
    <header
      className={cn(
        'relative overflow-hidden border-b border-app-border bg-app-card',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-light via-app-card to-beige-light/60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-beige/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-5 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-white shadow-soft sm:h-[4.5rem] sm:w-[4.5rem]"
              aria-hidden
            >
              <img
                src={leafSprig}
                alt=""
                className="h-9 w-9 object-contain sm:h-10 sm:w-10"
              />
              <span className="sr-only">{restaurantName} logo</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                    open
                      ? 'bg-success-light text-success-dark'
                      : 'bg-app-surface-muted text-app-text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                      open ? 'bg-success' : 'bg-app-text-muted',
                    )}
                  />
                  {open ? 'Open now' : 'Closed'}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-app-text-secondary shadow-none"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  8:00 – 23:00
                </Badge>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-app-text-title sm:text-3xl">
                {restaurantName}
              </h1>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-app-text-secondary sm:text-[15px]">
                {brand.tagline}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-0 bg-white/90 px-2.5 py-1 text-xs font-semibold text-app-text-title shadow-none hover:bg-white/90">
                  <Star className="mr-1 h-3.5 w-3.5 fill-warning text-warning" />
                  {brand.rating.toFixed(1)}
                  <span className="ml-1 font-normal text-app-text-muted">
                    ({brand.ratingCount})
                  </span>
                </Badge>
                {brand.cuisineBadges.map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant="outline"
                    className="rounded-full border-app-border/80 bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-primary-dark"
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end">
            <Badge className="rounded-full border-0 bg-primary px-3 py-1.5 text-xs font-semibold shadow-soft hover:bg-primary">
              Table {tableNumber}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-primary/25 bg-primary-light/80 px-3 py-1 text-[11px] font-medium text-primary-dark"
            >
              QR ordering
            </Badge>
          </div>
        </div>

        <Separator className="my-4 bg-app-border/70" />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-app-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary-dark" />
            Dine-in · Table {tableNumber}
          </span>
          <span className="hidden h-3 w-px bg-app-border sm:inline-block" />
          <span>Scan-to-order · Menu updates live</span>
          {!open && (
            <>
              <span className="hidden h-3 w-px bg-app-border sm:inline-block" />
              <span className="text-warning-dark">Kitchen opens at 8:00 AM</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
