'use client';

import { useEffect } from 'react';
import { VIEW_COOKIE, type DashboardView } from '@/lib/roles';

// Remembers the last dashboard view for a year (read on the server by /dashboard). A plain
// preference cookie: no identity, no secrets.
export function RememberView({ view }: { view: DashboardView }) {
  useEffect(() => {
    document.cookie = `${VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`;
  }, [view]);
  return null;
}
