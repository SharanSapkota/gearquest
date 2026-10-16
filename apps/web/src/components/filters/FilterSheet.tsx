'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { SearchParams } from '@/lib/gearFilters';
import { FILTER_FORM_ID, FilterForm } from './FilterForm';

export function FilterActions() {
  const t = useTranslations('filters');
  return (
    <>
      <Button variant="outline" type="reset" form={FILTER_FORM_ID}>
        {t('reset')}
      </Button>
      <Button type="submit" form={FILTER_FORM_ID}>
        {t('apply')}
      </Button>
    </>
  );
}

// Loaded on demand (next/dynamic in FilterControls): the form and sheet stay out of the first load.
// Bottom sheet on phones, side panel on desktop (the map page), popover is used on the home page.
export default function FilterSheet({
  open,
  onClose,
  basePath,
  values,
  preserve,
}: {
  open: boolean;
  onClose: () => void;
  basePath: string;
  values: SearchParams;
  preserve?: string[];
}) {
  const t = useTranslations('filters');
  return (
    <Sheet open={open} onClose={onClose} title={t('title')} footer={<FilterActions />}>
      <FilterForm basePath={basePath} values={values} preserve={preserve} onDone={onClose} />
    </Sheet>
  );
}
