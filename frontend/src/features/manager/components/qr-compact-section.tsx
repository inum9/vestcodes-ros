import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import QrPreview from '@/components/shared/qr-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RestaurantTable } from '@/lib/manager-api';

type QrCompactSectionProps = {
  tables: RestaurantTable[];
  loading?: boolean;
  error?: string;
  downloadingTableId: number | null;
  onDownload: (table: RestaurantTable) => void;
};

export default function QrCompactSection({
  tables,
  loading,
  error,
  downloadingTableId,
  onDownload,
}: QrCompactSectionProps) {
  const preview = tables.slice(0, 4);

  return (
    <Card className="border-app-border/80 bg-app-surface/30 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
            <QrCode className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-app-text-title">Table QR codes</p>
            <p className="text-xs text-app-text-muted">
              {loading ? 'Loading…' : `${tables.length} tables · print for dine-in ordering`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-lg border-app-border bg-app-card">
            <Link to="/manager/qr">Manage QR codes</Link>
          </Button>
        </div>
      </CardContent>

      {error && (
        <p className="px-4 pb-3 text-xs text-warning-dark">{error}</p>
      )}

      {!loading && preview.length > 0 && (
        <div className="flex gap-3 overflow-x-auto border-t border-app-border/60 px-4 py-3 scrollbar-none">
          {preview.map((table) => (
            <div
              key={table.id}
              className="w-28 shrink-0 rounded-xl border border-app-border/60 bg-app-card p-2 text-center transition hover:shadow-soft"
            >
              <p className="text-xs font-medium text-app-text-title">T{table.number}</p>
              <div className="my-1 scale-90">
                <QrPreview tableId={table.id} size="sm" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={downloadingTableId === table.id}
                onClick={() => onDownload(table)}
                className="h-7 w-full rounded-md px-1 text-[10px]"
              >
                {downloadingTableId === table.id ? '…' : 'PNG'}
              </Button>
            </div>
          ))}
          {tables.length > 4 && (
            <Link
              to="/manager/qr"
              className="flex w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-surface/50 text-xs font-medium text-primary-dark hover:bg-primary-light/50"
            >
              +{tables.length - 4} more
            </Link>
          )}
        </div>
      )}

      {loading && (
        <div className="flex gap-3 border-t border-app-border/60 px-4 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
      )}
    </Card>
  );
}
