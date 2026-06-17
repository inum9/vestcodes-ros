import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type KitchenKanbanColumnProps = {
  title: string;
  subtitle: string;
  count: number;
  accent: 'warning' | 'primary' | 'success';
  loading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  children: ReactNode;
};

const ACCENT = {
  warning: {
    header: 'border-warning/30 bg-warning-light/40',
    dot: 'bg-warning',
    badge: 'bg-warning-light text-warning-dark',
  },
  primary: {
    header: 'border-primary/30 bg-primary-light/40',
    dot: 'bg-primary',
    badge: 'bg-primary-light text-primary-dark',
  },
  success: {
    header: 'border-success/30 bg-success-light/40',
    dot: 'bg-success',
    badge: 'bg-success-light text-success-dark',
  },
};

export default function KitchenKanbanColumn({
  title,
  subtitle,
  count,
  accent,
  loading,
  emptyTitle,
  emptyHint,
  children,
}: KitchenKanbanColumnProps) {
  const styles = ACCENT[accent];
  const isEmpty = !loading && count === 0;

  return (
    <section className="flex h-full min-h-[360px] flex-col rounded-3xl border border-app-border bg-app-card/90 shadow-soft sm:min-h-[420px]">
      <header
        className={cn(
          'flex items-start justify-between gap-3 rounded-t-3xl border-b px-4 py-4 sm:px-5',
          styles.header,
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', styles.dot)} />
            <h2 className="text-lg font-bold tracking-tight text-app-text-title sm:text-xl">{title}</h2>
          </div>
          <p className="mt-1 text-xs text-app-text-secondary sm:text-sm">{subtitle}</p>
        </div>
        <span
          className={cn(
            'flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-2 text-sm font-bold tabular-nums',
            styles.badge,
          )}
        >
          {count}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-app-text-secondary">Loading board…</p>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-surface/40 px-4 py-10 text-center">
            <p className="text-base font-semibold text-app-text-secondary">{emptyTitle}</p>
            {emptyHint && <p className="mt-1 text-xs text-app-text-muted">{emptyHint}</p>}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
