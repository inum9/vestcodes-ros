import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  downloadBillingExport,
  downloadInvoicePdf,
  fetchInvoices,
  formatCurrency,
  formatDate,
  type Invoice,
} from '../../lib/manager-api';

export default function ManagerBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function load(q?: string) {
    setLoading(true);
    setError('');
    try {
      setInvoices(await fetchInvoices(q));
    } catch {
      setError('Could not load invoices.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    void load(search);
  }

  async function handleExport() {
    setExporting(true);
    setError('');
    try {
      await downloadBillingExport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadPdf(invoiceId: number) {
    setDownloadingId(invoiceId);
    setError('');
    try {
      await downloadInvoicePdf(invoiceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-app-text-title">Billing</h1>
          <p className="mt-1 text-sm text-app-text-secondary">Invoices from served orders.</p>
        </div>
        <Button type="button" disabled={exporting} onClick={() => void handleExport()} className="rounded-xl">
          {exporting ? 'Exporting…' : 'Export all to XLSX'}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search by order ID or table number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" className="rounded-xl">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setSearch('');
            void load();
          }}
        >
          Clear
        </Button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-app-border bg-app-card shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-app-border bg-app-surface text-xs uppercase text-app-text-muted">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Subtotal</th>
              <th className="px-4 py-3">GST</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-app-text-secondary">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-app-border last:border-0">
                  <td className="px-4 py-3 font-medium text-app-text-title">#{inv.id}</td>
                  <td className="px-4 py-3">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3">#{inv.order.id}</td>
                  <td className="px-4 py-3">{inv.order.table.number}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.subtotal)}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.gstAmount)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={downloadingId === inv.id}
                      onClick={() => void handleDownloadPdf(inv.id)}
                      className="rounded-lg"
                    >
                      {downloadingId === inv.id ? '…' : 'PDF'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
