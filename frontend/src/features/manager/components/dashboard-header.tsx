import { CalendarDays, Sparkles } from 'lucide-react';
import leafSprig from '@/assets/leaf-sprig.svg';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const RESTAURANT_NAME = 'Demo Kitchen';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type DashboardHeaderProps = {
  managerEmail?: string;
  className?: string;
};

export default function DashboardHeader({ managerEmail, className }: DashboardHeaderProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-soft',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-light/90 via-app-card to-beige-light/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-white shadow-soft">
            <img src={leafSprig} alt="" className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 bg-white/70 text-[10px] font-semibold uppercase tracking-widest text-primary-dark"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Manager
              </Badge>
            </div>
            <h1 className="truncate text-xl font-semibold tracking-tight text-app-text-title sm:text-2xl">
              {RESTAURANT_NAME}
            </h1>
            <p className="mt-0.5 text-sm text-app-text-secondary">
              {greeting()}
              {managerEmail ? ` · ${managerEmail.split('@')[0]}` : ''}
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 rounded-xl border border-app-border/80 bg-white/70 px-3 py-2 text-sm text-app-text-secondary shadow-insetSoft backdrop-blur-sm sm:w-auto">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary-dark" />
          <span className="truncate text-xs sm:text-sm">
            <span className="sm:hidden">
              {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="hidden sm:inline">{formatTodayDate()}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export { RESTAURANT_NAME };
