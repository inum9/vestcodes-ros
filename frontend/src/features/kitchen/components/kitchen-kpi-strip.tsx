import { Clock, Flame, PackageCheck, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { averagePrepTimeMs, formatTimer } from '@/lib/kitchen-display';
import type { KitchenOrder } from '@/lib/kitchen-api';
import { cn } from '@/lib/utils';

type KitchenKpiStripProps = {
  pending: number;
  preparing: number;
  ready: number;
  orders: KitchenOrder[];
  loading?: boolean;
  now: number;
};

type KpiItem = {
  label: string;
  value: string;
  icon: typeof Clock;
  accent: string;
};

export default function KitchenKpiStrip({
  pending,
  preparing,
  ready,
  orders,
  loading,
  now,
}: KitchenKpiStripProps) {
  const avgPrep = averagePrepTimeMs(orders, now);

  const items: KpiItem[] = [
    {
      label: 'Pending',
      value: String(pending),
      icon: Clock,
      accent: 'bg-warning-light text-warning-dark',
    },
    {
      label: 'Preparing',
      value: String(preparing),
      icon: Flame,
      accent: 'bg-primary-light text-primary-dark',
    },
    {
      label: 'Ready',
      value: String(ready),
      icon: PackageCheck,
      accent: 'bg-success-light text-success-dark',
    },
    {
      label: 'Avg prep time',
      value: avgPrep != null ? formatTimer(avgPrep) : '—',
      icon: Timer,
      accent: 'bg-beige-light text-app-text-primary',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-app-border bg-app-card shadow-soft">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon, accent }) => (
        <Card
          key={label}
          className="border-app-border bg-app-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">{label}</p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-app-text-title sm:text-3xl">
                {value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
