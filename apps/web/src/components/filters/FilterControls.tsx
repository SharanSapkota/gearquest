'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useCallback, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterIcon, SearchIcon } from '@/components/ui/icons';
import { Popover } from '@/components/ui/Popover';
import { countActiveFilters } from '@/lib/filterUrl';
import type { SearchParams } from '@/lib/gearFilters';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { CategoryChips } from './CategoryChips';
import { FilterForm } from './FilterForm';
import { FilterActions } from './FilterSheet';
import { useFilterNav } from './useFilterNav';

const FilterSheet = dynamic(() => import('./FilterSheet'), { ssr: false });

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// The single filter row: category chips with a "Filters" button. Popover on desktop (home),
// bottom sheet on phones. On the map it also carries a search box and always opens the side
// sheet, so nothing is clipped by the full-screen map.
export function FilterControls({
  basePath,
  values,
  preserve,
  variant = 'bar',
}: {
  basePath: string;
  values: SearchParams;
  // Non-filter params that survive Apply/Reset (e.g. the map position).
  preserve?: string[];
  variant?: 'bar' | 'map';
}) {
  const t = useTranslations();
  const push = useFilterNav(basePath);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const desktop = useMediaQuery('(min-width: 768px)');
  const active = countActiveFilters(values);
  const category = str(values.category);

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q');
    push({ q: typeof q === 'string' ? q.trim() : undefined });
  };

  const button = (
    <Button
      variant="outline"
      className="filters-btn"
      data-popover-trigger
      onClick={() => setOpen((o) => !o)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={active > 0 ? `${t('filters.title')}, ${t('filters.active', { count: active })}` : undefined}
    >
      <FilterIcon size={18} />
      <span className="filters-btn__label">{t('filters.title')}</span>
      {active > 0 && (
        <span className="count-badge" aria-hidden="true">
          {active}
        </span>
      )}
    </Button>
  );

  const asPopover = variant === 'bar' && desktop;
  const trigger = asPopover ? (
    <Popover
      open={open}
      onClose={close}
      label={t('filters.title')}
      align="end"
      trigger={button}
      className="filters-pop"
    >
      <div className="pop__scroll">
        <FilterForm basePath={basePath} values={values} preserve={preserve} onDone={close} />
      </div>
      <div className="pop__foot">
        <FilterActions />
      </div>
    </Popover>
  ) : (
    button
  );

  if (variant === 'map') {
    return (
      <>
        <div className="filterbar filterbar--map">
          <form className="searchbar" role="search" onSubmit={onSearch} key={str(values.q)}>
            <div className="searchbar__field">
              <SearchIcon size={18} />
              <input
                type="search"
                name="q"
                enterKeyHint="search"
                defaultValue={str(values.q)}
                placeholder={t('filters.searchPlaceholder')}
                aria-label={t('filters.search')}
              />
            </div>
            {trigger}
          </form>
          <CategoryChips basePath={basePath} category={category} />
        </div>
        {open && (
          <FilterSheet open onClose={close} basePath={basePath} values={values} preserve={preserve} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="filterbar">
        <CategoryChips basePath={basePath} category={category} />
        {trigger}
      </div>
      {open && !asPopover && (
        <FilterSheet open onClose={close} basePath={basePath} values={values} preserve={preserve} />
      )}
    </>
  );
}
