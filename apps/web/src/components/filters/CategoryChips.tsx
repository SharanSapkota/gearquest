'use client';

import { useTranslations } from 'next-intl';
import { CATEGORIES } from '@gearquest/shared';
import { Chip } from '@/components/ui/Chip';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CompassIcon } from '@/components/ui/icons';
import { useFilterNav } from './useFilterNav';

// Category chips with the same glyphs as the map markers. Horizontal scroll with edge fade.
export function CategoryChips({ basePath, category }: { basePath: string; category: string }) {
  const t = useTranslations();
  const push = useFilterNav(basePath);
  return (
    <div className="chips" role="group" aria-label={t('filters.category')}>
      <Chip pressed={category === ''} onClick={() => push({ category: undefined })}>
        <CompassIcon size={18} />
        {t('filters.allCategories')}
      </Chip>
      {CATEGORIES.map((c) => (
        <Chip key={c} pressed={category === c} onClick={() => push({ category: category === c ? undefined : c })}>
          <CategoryIcon category={c} size={18} />
          {t(`categories.${c}`)}
        </Chip>
      ))}
    </div>
  );
}
