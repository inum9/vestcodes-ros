import { Award, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TopItem = { name: string; quantity: number };

const RANK_STYLES = [
  'bg-warning-light text-warning-dark ring-warning/30',
  'bg-app-surface text-app-text-secondary ring-app-border',
  'bg-beige-light text-primary-dark ring-beige/50',
];

type TopSellersChartProps = {
  items: TopItem[];
  loading?: boolean;
};

export default function TopSellersChart({ items, loading }: TopSellersChartProps) {
  const max = Math.max(1, ...items.map((i) => i.quantity));

  return (
    <Card className="border-app-border bg-app-card shadow-soft transition-shadow duration-300 hover:shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-app-text-title">
          <Award className="h-4 w-4 text-primary-dark" />
          Top selling items
        </CardTitle>
        <p className="text-sm text-app-text-secondary">All-time by quantity served</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-surface/50 text-center">
            <UtensilsCrossed className="mb-2 h-8 w-8 text-app-text-muted" />
            <p className="text-sm font-medium text-app-text-secondary">No sales data yet</p>
            <p className="mt-1 text-xs text-app-text-muted">Rankings appear after orders are served</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.name}
                className="group flex items-center gap-3 rounded-xl border border-transparent bg-app-surface/50 p-3 transition-all duration-300 hover:border-app-border hover:bg-app-surface hover:shadow-soft"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1',
                    RANK_STYLES[index] ?? 'bg-app-surface text-app-text-muted ring-app-border',
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-app-text-title">{item.name}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-app-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success/70 to-success transition-all duration-700 group-hover:from-success group-hover:to-success-dark"
                      style={{ width: `${(item.quantity / max) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-app-text-title">{item.quantity}</p>
                  <p className="text-[10px] text-app-text-muted">sold</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
