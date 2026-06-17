import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ManagerAlert from '@/features/manager/components/manager-alert';
import QrPreview from '@/components/shared/qr-preview';
import { PageHeader } from '@/components/shared/responsive-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createTable,
  deleteTable,
  downloadTableQr,
  fetchTables,
  type RestaurantTable,
} from '@/lib/manager-api';

export default function ManagerQrPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const [tableNumber, setTableNumber] = useState('');
  const [zone, setZone] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchTables();
      setTables(list);
      return list;
    } catch {
      setError('Could not load tables.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load().then((list) => {
      if (!list) return;
      const next = list.length ? Math.max(...list.map((t) => t.number)) + 1 : 1;
      setTableNumber(String(next));
    });
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        String(t.number).includes(q) ||
        (t.zone?.toLowerCase().includes(q.toLowerCase()) ?? false),
    );
  }, [tables, search]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAdding(true);

    const number = Number(tableNumber);
    if (!Number.isInteger(number) || number < 1) {
      setError('Table number must be a positive whole number.');
      setAdding(false);
      return;
    }

    try {
      const created = await createTable({
        number,
        zone: zone.trim() || undefined,
      });
      setZone('');
      setSuccess(`Table ${created.number} added. QR code is ready below.`);
      const list = await load();
      if (list) {
        const next = Math.max(...list.map((t) => t.number)) + 1;
        setTableNumber(String(next));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add table');
    } finally {
      setAdding(false);
    }
  }

  async function handleDownload(table: RestaurantTable) {
    setDownloadingId(table.id);
    setError('');
    try {
      await downloadTableQr(table.id, table.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRemove(table: RestaurantTable) {
    if (
      !window.confirm(
        `Remove Table ${table.number}? This cannot be undone if the table has order history.`,
      )
    ) {
      return;
    }

    setRemovingId(table.id);
    setError('');
    setSuccess('');
    try {
      await deleteTable(table.id);
      setSuccess(`Table ${table.number} removed.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove table');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="QR codes"
        description="Add tables, assign zones, and download QR codes for customer ordering."
      />

      {error && <ManagerAlert message={error} />}

      {success && (
        <div className="rounded-2xl border border-success/30 bg-success-light px-4 py-3 text-sm text-success-dark">
          {success}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-app-border bg-app-card p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-app-text-title">Add a table</h2>
            <p className="text-xs text-app-text-muted">
              Table numbers must be unique per restaurant
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="table-number">Table number</Label>
            <Input
              id="table-number"
              type="number"
              min={1}
              step={1}
              required
              placeholder="e.g. 7"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="rounded-xl border-app-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-zone">Zone (optional)</Label>
            <Input
              id="table-zone"
              placeholder="e.g. Patio, Main hall"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="rounded-xl border-app-border"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={adding}
              className="w-full rounded-xl sm:w-auto"
            >
              {adding ? 'Adding…' : 'Add table'}
            </Button>
          </div>
        </div>
      </form>

      <div>
        <Input
          type="search"
          placeholder="Search by table number or zone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-xl border-app-border"
        />
      </div>

      {loading ? (
        <p className="text-sm text-app-text-secondary">Loading tables…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-app-border bg-app-surface/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-app-text-secondary">
            {tables.length === 0 ? 'No tables yet' : 'No tables match your search'}
          </p>
          <p className="mt-1 text-xs text-app-text-muted">
            {tables.length === 0
              ? 'Use the form above to add your first table.'
              : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((table) => (
            <article
              key={table.id}
              className="rounded-2xl border border-app-border bg-app-card p-4 shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-app-text-title">
                    Table {table.number}
                  </h2>
                  {table.zone && (
                    <p className="text-xs text-app-text-muted">{table.zone}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={removingId === table.id}
                  onClick={() => void handleRemove(table)}
                  className="h-8 w-8 shrink-0 rounded-lg text-app-text-muted hover:bg-warning-light hover:text-warning-dark"
                  title="Remove table"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <QrPreview tableId={table.id} />
              <Button
                type="button"
                disabled={downloadingId === table.id}
                onClick={() => void handleDownload(table)}
                className="mt-4 w-full rounded-xl"
              >
                {downloadingId === table.id ? 'Downloading…' : 'Download PNG'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
