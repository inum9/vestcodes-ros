import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { categorySlug } from '@/lib/menu-display';

type CategoryNavProps = {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
};

export default function CategoryNav({ categories, activeCategory, onSelect }: CategoryNavProps) {
  const tabs = ['All', ...categories];

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      aria-label="Menu categories"
    >
      {tabs.map((category) => {
        const isActive = activeCategory === category;
        return (
          <Button
            key={category}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(category)}
            className={cn(
              'shrink-0 rounded-full px-4 transition-all duration-200',
              isActive
                ? 'border-primary bg-primary text-white shadow-soft hover:bg-primary/90'
                : 'border-app-border bg-app-card text-app-text-secondary hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark',
            )}
          >
            {category}
          </Button>
        );
      })}
    </nav>
  );
}

export function scrollToCategory(category: string) {
  if (category === 'All') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(`category-${categorySlug(category)}`);
  if (el) {
    const offset = 140;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
