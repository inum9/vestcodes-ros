import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number | null;
  trendLabel?: string;
  loading?: boolean;
  accent?: 'primary' | 'success' | 'warning';
};

const ACCENT_STYLES = {
  primary: 'bg-primary-light text-primary-dark',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs yesterday',
  loading,
  accent = 'primary',
}: KpiCardProps) {
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;
  const trendFlat = trend != null && trend === 0;

  return (
    <Card className="group overflow-hidden border-app-border bg-app-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105',
              ACCENT_STYLES[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {!loading && trend != null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                trendUp && 'bg-success-light text-success-dark',
                trendDown && 'bg-warning-light text-warning-dark',
                trendFlat && 'bg-app-surface text-app-text-muted',
              )}
            >
              {trendUp && <ArrowUpRight className="h-3 w-3" />}
              {trendDown && <ArrowDownRight className="h-3 w-3" />}
              {trendFlat && <Minus className="h-3 w-3" />}
              {Math.abs(Math.round(trend))}%
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-app-text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-app-text-title sm:text-3xl">{value}</p>
            {trend != null && (
              <p className="mt-1 text-xs text-app-text-muted">{trendLabel}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-app-border bg-app-card shadow-soft">
          <CardContent className="p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-4 h-3 w-24" />
            <Skeleton className="mt-2 h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
