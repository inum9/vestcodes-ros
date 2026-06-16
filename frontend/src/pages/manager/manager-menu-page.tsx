import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createMenuItem,
  fetchMenuItems,
  toggleMenuItem,
  updateMenuItem,
  type MenuItem,
} from '../../lib/manager-api';

type EditState = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
};

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
    <div>
      <h1 className="text-2xl font-semibold text-app-text-title">Menu management</h1>
      <p className="mt-1 text-sm text-app-text-secondary">Add, edit, and toggle item availability.</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-6 grid gap-3 rounded-2xl border border-app-border bg-app-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          min="1"
          step="1"
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Add item
        </button>
      </form>

      <div className="mt-4">
        <input
          type="search"
          placeholder="Search by name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-app-border px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-app-border bg-app-card shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-app-border bg-app-surface text-xs uppercase text-app-text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-app-text-secondary">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-app-border last:border-0">
                  <td className="px-4 py-3 font-medium text-app-text-title">{item.name}</td>
                  <td className="px-4 py-3 text-app-text-secondary">{item.category}</td>
                  <td className="px-4 py-3">₹{item.price}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleToggle(item.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.available
                          ? 'bg-success-light text-success-dark'
                          : 'bg-app-surface text-app-text-muted'
                      }`}
                    >
                      {item.available ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEdit({
                          id: item.id,
                          name: item.name,
                          description: item.description ?? '',
                          category: item.category,
                          price: String(item.price),
                        })
                      }
                      className="text-sm font-medium text-primary-dark hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md rounded-2xl border border-app-border bg-app-card p-6 shadow-card"
          >
            <h2 className="text-lg font-semibold text-app-text-title">Edit item</h2>
            <div className="mt-4 space-y-3">
              <input
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-sm"
                placeholder="Name"
              />
              <input
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-sm"
                placeholder="Description"
              />
              <input
                required
                value={edit.category}
                onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-sm"
                placeholder="Category"
              />
              <input
                required
                type="number"
                min="1"
                value={edit.price}
                onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-sm"
                placeholder="Price"
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="flex-1 rounded-xl border border-app-border py-2 text-sm font-medium hover:bg-app-surface"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
