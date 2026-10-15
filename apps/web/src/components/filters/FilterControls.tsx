'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { CATEGORIES } from '@gearshare/shared';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { FilterIcon, SearchIcon } from '@/components/ui/icons';
import { useRouter } from '@/i18n/navigation';
import { countActiveFilters, withParams } from '@/lib/filterUrl';
import type { SearchParams } from '@/lib/gearFilters';

const FilterSheet = dynamic(() => import('./FilterSheet'), { ssr: false });

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// Search box, "Filters" button and quick category chips. Used on the home page and floating over
// the map: only the presentation differs, the state is the same URL params.
export function FilterControls({
  basePath,
  values,
  preserve,
}: {
  basePath: string;
  values: SearchParams;
  // Non-filter params that survive Apply/Reset (e.g. the map position).
  preserve?: string[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(values);
  const category = str(values.category);

  // Quick changes start from the live URL so the map position and other params are kept.
  const push = (changes: Record<string, string | undefined>) => {
    const qs = withParams(window.location.search, changes).toString();
    router.push(`${basePath}${qs ? `?${qs}` : ''}`);
  };

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q');
    push({ q: typeof q === 'string' ? q.trim() : undefined });
  };

  return (
    <>
      <div className="filterbar">
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
          <Button
            variant="outline"
            className="filters-btn"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
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
        </form>
        <div className="chips" role="group" aria-label={t('filters.category')}>
          <Chip pressed={category === ''} onClick={() => push({ category: undefined })}>
            {t('filters.allCategories')}
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              pressed={category === c}
              onClick={() => push({ category: category === c ? undefined : c })}
            >
              {t(`categories.${c}`)}
            </Chip>
          ))}
        </div>
      </div>
      {open && (
        <FilterSheet
          open
          onClose={() => setOpen(false)}
          basePath={basePath}
          values={values}
          preserve={preserve}
        />
      )}
    </>
  );
}
