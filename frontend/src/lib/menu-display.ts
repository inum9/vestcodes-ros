import type { MenuItem } from './customer-api';

export type MenuBadge = 'popular' | 'new' | 'recommended';

/** Self-hosted images — reliable, matched to each seeded dish name */
const LOCAL_IMAGES: Record<string, string> = {
  'Masala Dosa': '/menu/masala-dosa.jpg',
  'Idli Sambar': '/menu/idli-sambar.jpg',
  'Paneer Butter Masala': '/menu/paneer-butter-masala.jpg',
  'Dal Tadka': '/menu/dal-tadka.jpg',
  'Butter Naan': '/menu/butter-naan.jpg',
  'Mango Lassi': '/menu/mango-lassi.jpg',
  'Gulab Jamun': '/menu/gulab-jamun.jpg',
  'Veg Biryani': '/menu/veg-biryani.jpg',
};

/** Match custom menu item names by keyword when no exact mapping exists */
const KEYWORD_IMAGES: ReadonlyArray<[string, string]> = [
  ['masala dosa', '/menu/masala-dosa.jpg'],
  ['dosa', '/menu/masala-dosa.jpg'],
  ['idli', '/menu/idli-sambar.jpg'],
  ['sambar', '/menu/idli-sambar.jpg'],
  ['paneer', '/menu/paneer-butter-masala.jpg'],
  ['butter masala', '/menu/paneer-butter-masala.jpg'],
  ['dal tadka', '/menu/dal-tadka.jpg'],
  ['dal', '/menu/dal-tadka.jpg'],
  ['tadka', '/menu/dal-tadka.jpg'],
  ['naan', '/menu/butter-naan.jpg'],
  ['lassi', '/menu/mango-lassi.jpg'],
  ['mango', '/menu/mango-lassi.jpg'],
  ['gulab', '/menu/gulab-jamun.jpg'],
  ['jamun', '/menu/gulab-jamun.jpg'],
  ['biryani', '/menu/veg-biryani.jpg'],
];

const CATEGORY_IMAGES: Record<string, string> = {
  Breakfast: '/menu/masala-dosa.jpg',
  'Main Course': '/menu/paneer-butter-masala.jpg',
  Breads: '/menu/butter-naan.jpg',
  Drinks: '/menu/mango-lassi.jpg',
  Desserts: '/menu/gulab-jamun.jpg',
};

const DEFAULT_IMAGE = '/menu/masala-dosa.jpg';

const BADGE_BY_NAME: Record<string, MenuBadge[]> = {
  'Masala Dosa': ['popular'],
  'Paneer Butter Masala': ['popular', 'recommended'],
  'Veg Biryani': ['popular'],
  'Gulab Jamun': ['new'],
  'Mango Lassi': ['new'],
  'Idli Sambar': ['recommended'],
  'Dal Tadka': ['recommended'],
};

const FEATURED_NAMES = [
  'Paneer Butter Masala',
  'Veg Biryani',
  'Masala Dosa',
  'Gulab Jamun',
];

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function resolveByKeyword(name: string): string | undefined {
  const lower = normalizeName(name);
  for (const [keyword, path] of KEYWORD_IMAGES) {
    if (lower.includes(keyword)) return path;
  }
  return undefined;
}

export function getMenuItemImage(item: MenuItem): string {
  if (item.imageUrl) return item.imageUrl;
  if (LOCAL_IMAGES[item.name]) return LOCAL_IMAGES[item.name];
  const byKeyword = resolveByKeyword(item.name);
  if (byKeyword) return byKeyword;
  return CATEGORY_IMAGES[item.category] ?? DEFAULT_IMAGE;
}

/** Ordered fallbacks when primary image fails to load */
export function getMenuImageSources(item: MenuItem): string[] {
  const seen = new Set<string>();
  const add = (src?: string) => {
    if (src && !seen.has(src)) {
      seen.add(src);
      return src;
    }
    return undefined;
  };

  const sources: string[] = [];
  for (const candidate of [
    item.imageUrl ?? undefined,
    LOCAL_IMAGES[item.name],
    resolveByKeyword(item.name),
    CATEGORY_IMAGES[item.category],
    DEFAULT_IMAGE,
  ]) {
    const src = add(candidate);
    if (src) sources.push(src);
  }

  return sources.length > 0 ? sources : [DEFAULT_IMAGE];
}

export function getItemBadges(item: MenuItem): MenuBadge[] {
  if (BADGE_BY_NAME[item.name]) return BADGE_BY_NAME[item.name];
  if (item.id % 5 === 0) return ['new'];
  if (item.id % 3 === 0) return ['popular'];
  return [];
}

export function getFeaturedItems(items: MenuItem[]): MenuItem[] {
  const featured = FEATURED_NAMES.map((name) => items.find((i) => i.name === name)).filter(
    (i): i is MenuItem => !!i,
  );
  if (featured.length >= 3) return featured;
  return [...items].sort((a, b) => b.price - a.price).slice(0, 4);
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

export function formatMenuPrice(amount: number, currency: string): string {
  if (currency === 'INR') return `₹${Math.round(amount)}`;
  return `${currency} ${amount.toFixed(2)}`;
}

export function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
}

export function filterMenuItems(items: MenuItem[], query: string): MenuItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.description?.toLowerCase().includes(q) ?? false),
  );
}

export const BADGE_LABELS: Record<MenuBadge, string> = {
  popular: 'Popular',
  new: 'New',
  recommended: 'Recommended',
};

export const BADGE_STYLES: Record<MenuBadge, string> = {
  popular: 'border-transparent bg-primary text-white shadow-sm',
  new: 'border-transparent bg-warning text-white shadow-sm',
  recommended: 'border-transparent bg-success text-white shadow-sm',
};
