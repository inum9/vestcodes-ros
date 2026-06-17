import type { LucideIcon } from 'lucide-react';
import {
  Cake,
  ChefHat,
  Coffee,
  CupSoda,
  Sandwich,
  UtensilsCrossed,
} from 'lucide-react';
import type { KitchenOrder } from '@/lib/kitchen-api';

export type KitchenColumn = 'approved' | 'preparing' | 'ready';
export type KitchenPriority = 'normal' | 'attention' | 'urgent';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  breakfast: Coffee,
  'main course': UtensilsCrossed,
  mains: UtensilsCrossed,
  breads: Sandwich,
  bread: Sandwich,
  drinks: CupSoda,
  beverages: CupSoda,
  desserts: Cake,
  dessert: Cake,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category.toLowerCase()] ?? ChefHat;
}

export function elapsedMs(iso: string, now = Date.now()): number {
  return Math.max(0, now - new Date(iso).getTime());
}

export function formatTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimerLabel(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min';
  return `${mins} mins`;
}

export function getKitchenPriority(iso: string, column: KitchenColumn, now = Date.now()): KitchenPriority {
  const mins = elapsedMs(iso, now) / 60000;

  if (column === 'approved') {
    if (mins >= 10) return 'urgent';
    if (mins >= 5) return 'attention';
  }
  if (column === 'preparing') {
    if (mins >= 20) return 'urgent';
    if (mins >= 12) return 'attention';
  }
  if (column === 'ready') {
    if (mins >= 8) return 'urgent';
    if (mins >= 4) return 'attention';
  }

  return 'normal';
}

export function priorityLabel(priority: KitchenPriority): string | null {
  if (priority === 'urgent') return 'Urgent';
  if (priority === 'attention') return 'Priority';
  return null;
}

export const PRIORITY_STYLES: Record<
  KitchenPriority,
  { ring: string; badge: string; pulse?: boolean }
> = {
  normal: {
    ring: 'ring-app-border/60',
    badge: 'bg-app-surface text-app-text-muted',
  },
  attention: {
    ring: 'ring-warning/50',
    badge: 'bg-warning-light text-warning-dark',
  },
  urgent: {
    ring: 'ring-destructive/60',
    badge: 'bg-destructive/10 text-destructive',
    pulse: true,
  },
};

export function sortKitchenFifo(orders: KitchenOrder[]): KitchenOrder[] {
  return [...orders].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );
}

export function averagePrepTimeMs(orders: KitchenOrder[], now = Date.now()): number | null {
  const cooking = orders.filter((o) => o.status === 'preparing');
  if (cooking.length === 0) return null;
  const total = cooking.reduce((sum, o) => sum + elapsedMs(o.updatedAt, now), 0);
  return total / cooking.length;
}

export function dominantCategory(order: KitchenOrder): string {
  const counts = new Map<string, number>();
  for (const line of order.orderItems) {
    const cat = line.menuItem.category ?? 'Other';
    counts.set(cat, (counts.get(cat) ?? 0) + line.quantity);
  }
  let best = 'Other';
  let bestCount = 0;
  for (const [cat, count] of counts) {
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}
