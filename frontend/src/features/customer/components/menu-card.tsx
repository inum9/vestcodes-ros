import { Minus, Plus } from 'lucide-react';
import MenuFoodImage from '@/features/customer/components/menu-food-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MenuItem } from '@/lib/customer-api';
import {
  BADGE_LABELS,
  BADGE_STYLES,
  formatMenuPrice,
  getItemBadges,
  type MenuBadge,
} from '@/lib/menu-display';
import { cn } from '@/lib/utils';

type MenuCardProps = {
  item: MenuItem;
  quantity: number;
  currency: string;
  onAdd: () => void;
  onRemove: () => void;
  variant?: 'default' | 'compact';
  className?: string;
};

function ItemBadges({ badges }: { badges: MenuBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <Badge
          key={badge}
          className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', BADGE_STYLES[badge])}
        >
          {BADGE_LABELS[badge]}
        </Badge>
      ))}
    </div>
  );
}

export default function MenuCard({
  item,
  quantity,
  currency,
  onAdd,
  onRemove,
  variant = 'default',
  className,
}: MenuCardProps) {
  const badges = getItemBadges(item);
  const isCompact = variant === 'compact';

  return (
    <Card
      className={cn(
        'group overflow-hidden border-app-border bg-app-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card',
        className,
      )}
    >
      <div className={cn('relative overflow-hidden bg-app-surface', isCompact ? 'aspect-[5/4]' : 'aspect-[4/3]')}>
        <MenuFoodImage
          item={item}
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <ItemBadges badges={badges} />
      </div>

      <CardContent className={cn('p-4', isCompact && 'p-3')}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-app-text-muted">
              {item.category}
            </p>
            <h3
              className={cn(
                'font-semibold text-app-text-title',
                isCompact ? 'text-sm leading-snug' : 'text-base',
              )}
            >
              {item.name}
            </h3>
          </div>
          <p className="shrink-0 text-sm font-semibold text-primary-dark">
            {formatMenuPrice(item.price, currency)}
          </p>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-app-text-secondary">
            {item.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          {quantity > 0 ? (
            <div className="flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-1 py-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 rounded-full border-0 bg-app-card shadow-none hover:bg-beige-light"
                aria-label={`Remove one ${item.name}`}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[1.25rem] text-center text-sm font-semibold text-app-text-primary">
                {quantity}
              </span>
              <Button
                type="button"
                size="icon"
                onClick={onAdd}
                className="h-8 w-8 rounded-full"
                aria-label={`Add one ${item.name}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onAdd}
              className="rounded-full px-5"
              size="sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
