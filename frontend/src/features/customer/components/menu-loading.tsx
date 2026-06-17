import { Skeleton } from '@/components/ui/skeleton';

export default function MenuLoading() {
  return (
    <main className="min-h-screen bg-app-background pb-24">
      <header className="relative overflow-hidden border-b border-app-border bg-app-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-app-card to-beige-light/60" />
        <div className="relative mx-auto max-w-5xl px-4 py-5 sm:py-6">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-48 sm:w-56" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-app-border bg-app-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-5xl space-y-3">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-8">
          <Skeleton className="mb-2 h-4 w-28" />
          <Skeleton className="mb-4 h-7 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-[280px] shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>

        <Skeleton className="mb-4 h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
