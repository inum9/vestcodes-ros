import { FormEvent, useEffect, useState } from 'react';
import { createStaff, fetchStaff, removeStaff, type StaffUser } from '../../lib/manager-api';
import { getUser } from '../../lib/auth';

const ROLE_STYLES: Record<string, string> = {
  manager: 'bg-primary-light text-primary-dark',
  floor: 'bg-success-light text-success-dark',
  kitchen: 'bg-beige-light text-app-text-primary',
};

export default function ManagerUsersPage() {
  const currentUser = getUser();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('floor');
  const [password, setPassword] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setUsers(await fetchStaff());
    } catch {
      setError('Could not load staff.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createStaff({ email, role, password });
      setEmail('');
      setPassword('');
      setRole('floor');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add user');
    }
  }

  async function handleRemove(id: number) {
    if (!window.confirm('Remove this staff member?')) return;
    setBusyId(id);
    setError('');
    try {
      await removeStaff(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove user');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-app-text-title">Staff users</h1>
      <p className="mt-1 text-sm text-app-text-secondary">Manage floor, kitchen, and manager accounts.</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-warning-dark">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-6 grid gap-3 rounded-2xl border border-app-border bg-app-card p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        >
          <option value="floor">Floor</option>
          <option value="kitchen">Kitchen</option>
          <option value="manager">Manager</option>
        </select>
        <input
          required
          type="password"
          minLength={8}
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-app-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Add user
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-app-border bg-app-card shadow-soft">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-app-border bg-app-surface text-xs uppercase text-app-text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-app-text-secondary">
                  No staff found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-app-border last:border-0">
                  <td className="px-4 py-3 font-medium text-app-text-title">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        ROLE_STYLES[user.role] ?? 'bg-app-surface text-app-text-secondary'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.id === currentUser?.id ? (
                      <span className="text-xs text-app-text-muted">You</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => void handleRemove(user.id)}
                        className="text-sm font-medium text-warning-dark hover:underline disabled:opacity-60"
                      >
                        Remove
                      </button>
                    )}
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
