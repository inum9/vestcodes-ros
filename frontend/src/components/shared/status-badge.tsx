import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STYLES: Record<string, string> = {
  pending: 'border-transparent bg-warning-light text-warning-dark hover:bg-warning-light',
  approved: 'border-transparent bg-primary-light text-primary-dark hover:bg-primary-light',
  preparing: 'border-transparent bg-beige-light text-app-text-primary hover:bg-beige-light',
  ready: 'border-transparent bg-success-light text-success-dark hover:bg-success-light',
  served: 'border-transparent bg-muted text-muted-foreground hover:bg-muted',
  rejected: 'border-transparent bg-app-surface-muted text-app-text-secondary hover:bg-app-surface-muted',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('capitalize', STYLES[status])}>
      {status}
    </Badge>
  );
}
