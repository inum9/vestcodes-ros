import { useMemo } from 'react';
import { Check, MapPin, Receipt, UtensilsCrossed } from 'lucide-react';
import leafSprig from '@/assets/leaf-sprig.svg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatMenuPrice } from '@/lib/menu-display';

type OrderSuccessScreenProps = {
  orderId: number;
  restaurantName: string;
  tableNumber: number;
  total: number;
  itemCount: number;
  currency: string;
  onBackToMenu: () => void;
};

const CONFETTI_COLORS = ['#8A9B5A', '#7BA05B', '#D8A06B', '#EEDCCB', '#728246'];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${4 + (i * 5.2) % 92}%`,
        delay: `${(i * 0.11) % 1.4}s`,
        duration: `${2.2 + (i % 4) * 0.35}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 3) * 2,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-0 animate-confetti-fall rounded-sm opacity-90"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size * 1.4,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}

function SuccessCheckmark() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-success/20 animate-success-ring" />
      <span
        className="absolute inset-2 rounded-full bg-success/10 animate-success-ring"
        style={{ animationDelay: '0.35s' }}
      />
      <div className="relative flex h-20 w-20 animate-success-pop items-center justify-center rounded-full bg-success shadow-soft">
        <Check className="h-10 w-10 stroke-[2.5] text-white" strokeLinecap="round" strokeLinejoin="round" />
      </div>
    </div>
  );
}

export default function OrderSuccessScreen({
  orderId,
  restaurantName,
  tableNumber,
  total,
  itemCount,
  currency,
  onBackToMenu,
}: OrderSuccessScreenProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app-background px-4 py-10">
      <ConfettiBurst />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-success-light/40 via-transparent to-beige-light/30"
        aria-hidden
      />

      <div className="relative w-full max-w-md animate-fade-up opacity-0 [animation-delay:0.15s]">
        <div className="mb-6 text-center">
          <SuccessCheckmark />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-app-text-title sm:text-[1.65rem]">
            Order received
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-app-text-secondary">
            We&apos;ve got your order. The kitchen will start preparing it shortly.
          </p>
        </div>

        <Card className="overflow-hidden border-app-border bg-app-card shadow-card">
          <div className="bg-gradient-to-r from-primary-light/80 to-beige-light/50 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-white shadow-soft">
                <img src={leafSprig} alt="" className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-app-text-title">{restaurantName}</p>
                <p className="text-xs text-app-text-muted">Thank you for dining with us</p>
              </div>
              <Badge className="shrink-0 rounded-full border-0 bg-success-light text-success-dark hover:bg-success-light">
                Order received
              </Badge>
            </div>
          </div>

          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-app-surface px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-app-text-muted">Order ID</p>
                <p className="mt-1 text-lg font-semibold text-primary-dark">#{orderId}</p>
              </div>
              <div className="rounded-xl bg-app-surface px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-app-text-muted">Table</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-app-text-title">
                  <MapPin className="h-4 w-4 text-primary-dark" />
                  {tableNumber}
                </p>
              </div>
            </div>

            <Separator className="bg-app-border/80" />

            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-app-text-secondary">
                <Receipt className="h-4 w-4 text-app-text-muted" />
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </span>
              <span className="font-semibold text-app-text-title">{formatMenuPrice(total, currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          className="mt-6 h-11 w-full rounded-xl shadow-soft"
          onClick={onBackToMenu}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Back to menu
        </Button>

        <p className="mt-4 text-center text-xs text-app-text-muted">
          Need help? Ask any floor staff member at Table {tableNumber}.
        </p>
      </div>
    </main>
  );
}
