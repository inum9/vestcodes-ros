import { FormEvent, useEffect, useMemo, useState } from 'react';
import ManagerAlert from '@/features/manager/components/manager-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, ResponsiveTableShell } from '@/components/shared/responsive-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  createMenuItem,
  fetchMenuItems,
  toggleMenuItem,
  updateMenuItem,
  type MenuItem,
} from '@/lib/manager-api';

type EditState = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
};

const inputClass = 'rounded-xl border-app-border';

export default function ManagerMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchMenuItems());
    } catch {
      setError('Could not load menu items.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
    );
  }, [items, search]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createMenuItem({
        name,
        description: description || undefined,
        category,
        price: Number(price),
      });
      setName('');
      setDescription('');
      setCategory('');
      setPrice('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add item');
    }
  }

  async function handleToggle(id: number) {
    setBusyId(id);
    setError('');
    try {
      await toggleMenuItem(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setError('');
    try {
      await updateMenuItem(edit.id, {
        name: edit.name,
        description: edit.description || undefined,
        category: edit.category,
        price: Number(edit.price),
      });
      setEdit(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Menu management"
        description="Add, edit, and toggle item availability."
      />

      {error && <ManagerAlert message={error} />}

      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-2xl border border-app-border bg-app-card p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <Input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
        <Input
          required
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        />
        <Input
          required
          type="number"
          min={1}
          step={1}
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={inputClass}
        />
        <Button
          type="submit"
          className="rounded-xl sm:col-span-2 lg:col-span-1 xl:col-span-1"
        >
          Add item
        </Button>
      </form>

      <Input
        type="search"
        placeholder="Search by name or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(inputClass, 'w-full sm:max-w-md')}
      />

      <ResponsiveTableShell minWidth="640px">
        <Table>
          <TableHeader className="bg-app-surface">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Name</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Category</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Price</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Available</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-6 text-app-text-secondary">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3 font-medium text-app-text-title">{item.name}</TableCell>
                  <TableCell className="px-4 py-3 text-app-text-secondary">{item.category}</TableCell>
                  <TableCell className="px-4 py-3">₹{item.price}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => void handleToggle(item.id)}
                      className={cn(
                        'rounded-full border-0 px-2.5 text-xs font-semibold',
                        item.available
                          ? 'bg-success-light text-success-dark hover:bg-success-light/80'
                          : 'bg-app-surface text-app-text-muted hover:bg-app-surface',
                      )}
                    >
                      {item.available ? 'Yes' : 'No'}
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-primary-dark"
                      onClick={() =>
                        setEdit({
                          id: item.id,
                          name: item.name,
                          description: item.description ?? '',
                          category: item.category,
                          price: String(item.price),
                        })
                      }
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ResponsiveTableShell>

      <Dialog open={edit != null} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit item</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  required
                  value={edit?.name ?? ''}
                  onChange={(e) => edit && setEdit({ ...edit, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={edit?.description ?? ''}
                  onChange={(e) => edit && setEdit({ ...edit, description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  required
                  value={edit?.category ?? ''}
                  onChange={(e) => edit && setEdit({ ...edit, category: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹)</Label>
                <Input
                  id="edit-price"
                  required
                  type="number"
                  min={1}
                  value={edit?.price ?? ''}
                  onChange={(e) => edit && setEdit({ ...edit, price: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <DialogFooter className="mt-5 gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
