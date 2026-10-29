import { cityKey as toCityKey } from '@gearquest/shared';
import { cache } from 'react';
import { api, type PublicGear } from './api';
import { LANDING_CATEGORIES, type LandingCategory } from '../content/landing';

export const LANDING_PAGE_SIZE = 24;

// One fetch per request shared by generateMetadata and the page. City pages match the
// normalized cityKey on the API, never a regex.
export const getLandingGear = cache(async (category: LandingCategory | undefined, cityKey: string | undefined, page: number) => {
  const res = await api.listGear({ category, city: cityKey, page, limit: LANDING_PAGE_SIZE });
  return res;
});

// Which landing categories / cities actually have gear, from up to 50 listings of the page's scope.
export const getScopeFacets = cache(async (category: LandingCategory | undefined, cityKey: string | undefined) => {
  const { items } = await api.listGear({ category, city: cityKey, limit: 50 });
  return {
    categories: LANDING_CATEGORIES.filter((c) => items.some((g: PublicGear) => g.category === c)),
    cityKeys: [...new Set(items.map((g: PublicGear) => toCityKey(g.city)))],
  };
});
