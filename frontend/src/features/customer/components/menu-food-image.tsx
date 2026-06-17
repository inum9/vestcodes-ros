import { UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import type { MenuItem } from '@/lib/customer-api';
import { getMenuImageSources } from '@/lib/menu-display';
import { cn } from '@/lib/utils';

type MenuFoodImageProps = {
  item: MenuItem;
  className?: string;
  imgClassName?: string;
};

export default function MenuFoodImage({ item, className, imgClassName }: MenuFoodImageProps) {
  const sources = getMenuImageSources(item);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || sourceIndex >= sources.length) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-light to-beige-light px-4 text-center',
          className,
        )}
      >
        <UtensilsCrossed className="h-8 w-8 text-primary-dark/70" aria-hidden />
        <span className="text-xs font-medium text-app-text-secondary">{item.name}</span>
      </div>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={item.name}
      loading="lazy"
      decoding="async"
      className={cn('h-full w-full object-cover', imgClassName)}
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
