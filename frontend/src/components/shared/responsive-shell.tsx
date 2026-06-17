import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ResponsiveTableShellProps = {
  children: ReactNode;
  className?: string;
  minWidth?: string;
};

/** Horizontal scroll wrapper for wide data tables on small screens. */
export function ResponsiveTableShell({
  children,
  className,
  minWidth = '640px',
}: ResponsiveTableShellProps) {
  return (
    <div
      className={cn(
        '-mx-3 overflow-x-auto rounded-2xl border border-app-border bg-app-card shadow-soft sm:mx-0',
        className,
      )}
    >
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

/** Standard page title block used across staff views. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-dark sm:text-xs">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-app-text-title sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-app-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Kanban / multi-column board: horizontal scroll on mobile, grid on large screens. */
export function ResponsiveBoard({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  const gridClass = columns === 3 ? 'xl:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory',
        'xl:grid xl:overflow-visible xl:pb-0',
        gridClass,
      )}
    >
      {children}
    </div>
  );
}

export function ResponsiveBoardColumn({ children }: { children: ReactNode }) {
  return (
    <div className="w-[min(88vw,400px)] shrink-0 snap-center sm:w-[min(72vw,420px)] xl:w-auto xl:min-w-0 xl:shrink">
      {children}
    </div>
  );
}
