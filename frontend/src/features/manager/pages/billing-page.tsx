import { FormEvent, useEffect, useState } from 'react';
import ManagerAlert from '@/features/manager/components/manager-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader, ResponsiveTableShell } from '@/components/shared/responsive-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  downloadBillingExport,
  downloadInvoicePdf,
  fetchInvoices,
  formatCurrency,
  formatDate,
  type Invoice,
} from '@/lib/manager-api';

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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Billing"
        description="Invoices from served orders."
        actions={
          <Button type="button" disabled={exporting} onClick={() => void handleExport()} className="rounded-xl">
            {exporting ? 'Exporting…' : 'Export XLSX'}
          </Button>
        }
      />

      {error && <ManagerAlert message={error} />}

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          type="search"
          placeholder="Search by order ID or table number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border-app-border sm:max-w-xs"
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

      <ResponsiveTableShell minWidth="720px">
        <Table>
          <TableHeader className="bg-app-surface">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Invoice</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Date</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Order</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Table</TableHead>
              <TableHead className="hidden px-4 py-3 text-xs uppercase text-app-text-muted sm:table-cell">
                Subtotal
              </TableHead>
              <TableHead className="hidden px-4 py-3 text-xs uppercase text-app-text-muted md:table-cell">
                GST
              </TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Total</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-4 py-6 text-app-text-secondary">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="px-4 py-3 font-medium text-app-text-title">#{inv.id}</TableCell>
                  <TableCell className="px-4 py-3">{formatDate(inv.createdAt)}</TableCell>
                  <TableCell className="px-4 py-3">#{inv.order.id}</TableCell>
                  <TableCell className="px-4 py-3">{inv.order.table.number}</TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">{formatCurrency(inv.subtotal)}</TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">{formatCurrency(inv.gstAmount)}</TableCell>
                  <TableCell className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</TableCell>
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ResponsiveTableShell>
    </div>
  );
}
