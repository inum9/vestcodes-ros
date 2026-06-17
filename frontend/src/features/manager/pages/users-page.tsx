import { FormEvent, useEffect, useState } from 'react';
import ManagerAlert from '@/features/manager/components/manager-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, ResponsiveTableShell } from '@/components/shared/responsive-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createStaff, fetchStaff, removeStaff, type StaffUser } from '@/lib/manager-api';
import { getUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

const ROLE_STYLES: Record<string, string> = {
  manager: 'bg-primary-light text-primary-dark hover:bg-primary-light',
  floor: 'bg-success-light text-success-dark hover:bg-success-light',
  kitchen: 'bg-beige-light text-app-text-primary hover:bg-beige-light',
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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Staff users"
        description="Manage floor, kitchen, and manager accounts."
      />

      {error && <ManagerAlert message={error} />}

      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-2xl border border-app-border bg-app-card p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="staff-email" className="sr-only">
            Email
          </Label>
          <Input
            id="staff-email"
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-app-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-role" className="sr-only">
            Role
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="staff-role" className="rounded-xl border-app-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="floor">Floor</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          required
          type="password"
          minLength={8}
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border-app-border"
        />
        <Button type="submit" className="rounded-xl sm:col-span-2 lg:col-span-1">
          Add user
        </Button>
      </form>

      <ResponsiveTableShell minWidth="480px">
        <Table>
          <TableHeader className="bg-app-surface">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Email</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Role</TableHead>
              <TableHead className="px-4 py-3 text-xs uppercase text-app-text-muted">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-6 text-app-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-6 text-app-text-secondary">
                  No staff found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3 font-medium text-app-text-title">{user.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full capitalize',
                        ROLE_STYLES[user.role] ?? 'bg-app-surface text-app-text-secondary',
                      )}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {user.id === currentUser?.id ? (
                      <span className="text-xs text-app-text-muted">You</span>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        disabled={busyId === user.id}
                        onClick={() => void handleRemove(user.id)}
                        className="h-auto p-0 text-warning-dark"
                      >
                        Remove
                      </Button>
                    )}
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
