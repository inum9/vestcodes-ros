import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeBucket } from '@/lib/manager-api';
import { cn } from '@/lib/utils';

const BUCKET_ORDER: TimeBucket[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

const BUCKET_META: Record<TimeBucket, { hours: string; color: string }> = {
  Morning: { hours: '6am – 12pm', color: 'from-warning/80 to-warning' },
  Afternoon: { hours: '12pm – 5pm', color: 'from-primary/70 to-primary' },
  Evening: { hours: '5pm – 9pm', color: 'from-success/80 to-success' },
  Night: { hours: '9pm – 6am', color: 'from-app-text-muted/60 to-app-text-muted' },
};

type TimeOfDayChartProps = {
  buckets: Record<TimeBucket, number>;
  peakBucket: TimeBucket | null;
  loading?: boolean;
};

export default function TimeOfDayChart({ buckets, peakBucket, loading }: TimeOfDayChartProps) {
  const total = BUCKET_ORDER.reduce((sum, b) => sum + buckets[b], 0);
  const max = Math.max(1, ...BUCKET_ORDER.map((b) => buckets[b]));

  return (
    <Card className="border-app-border bg-app-card shadow-soft transition-shadow duration-300 hover:shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-app-text-title">
          <Clock className="h-4 w-4 text-primary-dark" />
          Orders by time of day
        </CardTitle>
        <p className="text-sm text-app-text-secondary">Today&apos;s served orders by period</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {BUCKET_ORDER.map((b) => (
              <Skeleton key={b} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-surface/50 text-center">
            <Clock className="mb-2 h-8 w-8 text-app-text-muted" />
            <p className="text-sm font-medium text-app-text-secondary">No orders today yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {BUCKET_ORDER.map((bucket) => {
              const count = buckets[bucket];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const isPeak = peakBucket === bucket;
              const meta = BUCKET_META[bucket];
              return (
                <div
                  key={bucket}
                  className={cn(
                    'rounded-xl border p-3 transition-all duration-300 hover:shadow-soft',
                    isPeak ? 'border-primary/30 bg-primary-light/40' : 'border-transparent bg-app-surface/60',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-app-text-title">
                        {bucket}
                        {isPeak && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                            Peak
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-app-text-muted">{meta.hours}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-app-text-title">{count}</p>
                      <p className="text-xs text-app-text-muted">{pct}%</p>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-app-surface">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', meta.color)}
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
