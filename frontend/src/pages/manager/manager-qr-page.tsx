import { useEffect, useMemo, useState } from 'react';
import QrPreview from '@/components/qr-preview';
import {
  downloadTableQr,
  fetchTables,
  type RestaurantTable,
} from '../../lib/manager-api';

export default function ManagerQrPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        setTables(await fetchTables());
      } catch {
        setError('Could not load tables.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return tables;
    return tables.filter((t) => String(t.number).includes(q));
  }, [tables, search]);

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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-app-text-title">QR codes</h1>
      <p className="mt-1 text-sm text-app-text-secondary">Table QR codes for customer ordering links.</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
          {error}
        </div>
      )}

      <input
        type="search"
        placeholder="Search by table number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full max-w-xs rounded-xl border border-app-border px-3 py-2 text-sm"
      />

      {loading ? (
        <p className="mt-6 text-sm text-app-text-secondary">Loading tables…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-sm text-app-text-secondary">No tables found.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((table) => (
            <article
              key={table.id}
              className="rounded-2xl border border-app-border bg-app-card p-4 shadow-soft"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-app-text-title">Table {table.number}</h2>
                {table.zone && (
                  <span className="text-xs text-app-text-muted">{table.zone}</span>
                )}
              </div>
              <QrPreview tableId={table.id} />
              <button
                type="button"
                disabled={downloadingId === table.id}
                onClick={() => handleDownload(table)}
                className="mt-4 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {downloadingId === table.id ? 'Downloading…' : 'Download PNG'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
