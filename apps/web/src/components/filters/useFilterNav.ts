'use client';

import { useRouter } from '@/i18n/navigation';
import { withParams } from '@/lib/filterUrl';

// Quick URL changes (search text, category, dates, near me). They start from the live URL so
// the map position and other params survive; page resets are handled by withParams.
export function useFilterNav(basePath: string) {
  const router = useRouter();
  return (changes: Record<string, string | undefined>) => {
    const qs = withParams(window.location.search, changes).toString();
    router.push(`${basePath}${qs ? `?${qs}` : ''}`);
  };
}
