export type RestaurantBrand = {
  tagline: string;
  cuisineBadges: string[];
  rating: number;
  ratingCount: string;
};

const BRANDS: Record<string, RestaurantBrand> = {
  'Demo Kitchen': {
    tagline: 'Authentic Indian cuisine · Made fresh for your table',
    cuisineBadges: ['North Indian', 'Vegetarian', 'South Indian'],
    rating: 4.7,
    ratingCount: '1.2k',
  },
};

const DEFAULT_BRAND: RestaurantBrand = {
  tagline: 'Order fresh from your table',
  cuisineBadges: ['Indian', 'Multi-cuisine'],
  rating: 4.5,
  ratingCount: '500+',
};

export function getRestaurantBrand(name: string): RestaurantBrand {
  return BRANDS[name] ?? DEFAULT_BRAND;
}

/** Demo hours: 8:00 – 23:00 */
export function isRestaurantOpen(now = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 8 && hour < 23;
}

export function getRestaurantInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
