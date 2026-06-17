import { CheckCircle2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { KitchenOrder } from '@/lib/kitchen-api';
import {
  categoryIcon,
  dominantCategory,
  elapsedMs,
  formatTimer,
  getKitchenPriority,
  priorityLabel,
  PRIORITY_STYLES,
  type KitchenColumn,
} from '@/lib/kitchen-display';
import { cn } from '@/lib/utils';

type KitchenOrderCardProps = {
  order: KitchenOrder;
  column: KitchenColumn;
  now: number;
  busy?: boolean;
  fading?: boolean;
  onAction?: () => void;
};

const ACTION_COPY: Record<Exclude<KitchenColumn, 'ready'>, { label: string; busy: string; icon: typeof Play }> = {
  approved: { label: 'Start cooking', busy: 'Starting…', icon: Play },
  preparing: { label: 'Mark ready', busy: 'Updating…', icon: CheckCircle2 },
};

export default function KitchenOrderCard({
  order,
  column,
  now,
  busy,
  fading,
  onAction,
}: KitchenOrderCardProps) {
  const elapsed = elapsedMs(order.updatedAt, now);
  const priority = getKitchenPriority(order.updatedAt, column, now);
  const styles = PRIORITY_STYLES[priority];
  const badge = priorityLabel(priority);
  const topCategory = dominantCategory(order);
  const TopIcon = categoryIcon(topCategory);
  const action = column !== 'ready' ? ACTION_COPY[column] : null;

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-app-card p-4 shadow-soft ring-2 transition-all duration-300 hover:shadow-card sm:p-5',
        styles.ring,
        fading && 'scale-[0.98] opacity-40',
        styles.pulse && 'animate-kds-pulse',
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-app-surface px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-app-text-muted">
              #{order.id}
            </span>
            {badge && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  styles.badge,
                )}
              >
                {badge}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary-dark sm:h-14 sm:w-14">
              <TopIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold leading-none tracking-tight text-app-text-title sm:text-4xl">
                T{order.table.number}
              </h3>
              <p className="mt-1 text-sm font-medium text-app-text-secondary">{topCategory}</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
            {column === 'approved' ? 'Waiting' : column === 'preparing' ? 'Cooking' : 'Ready'}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-app-text-title sm:text-3xl">
            {formatTimer(elapsed)}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-app-border/70 pt-4">
        {order.orderItems.map((line) => {
          const Icon = categoryIcon(line.menuItem.category ?? 'Other');
          return (
            <li key={line.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-surface text-primary-dark">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-primary px-1.5 text-sm font-bold text-white">
                {line.quantity}
              </span>
              <span className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-app-text-title sm:text-lg">
                {line.menuItem.name}
              </span>
            </li>
          );
        })}
      </ul>

      {action && onAction ? (
        <Button
          type="button"
          size="lg"
          disabled={busy}
          onClick={onAction}
          className="mt-4 h-12 w-full rounded-xl text-base font-semibold shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <action.icon className="h-5 w-5" />
          {busy ? action.busy : action.label}
        </Button>
      ) : (
        <div className="mt-4 rounded-xl border border-success/30 bg-success-light/60 px-4 py-3 text-center text-sm font-semibold text-success-dark">
          Waiting for floor pickup
        </div>
      )}
    </article>
  );
}
