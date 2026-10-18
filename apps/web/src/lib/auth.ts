import { cache } from 'react';
import { redirect } from '@/i18n/navigation';
import { api } from './api';
import { isOwnerReady, isOwnerRole } from './roles';
import { safeRedirect } from './safeRedirect';

// Server-side current user, read once per request via the single API client.
export const getCurrentUser = cache(() => api.getMe());

// Guard for auth-required pages. `path` is the page's own locale-less path (with query), used to
// come back after signing in.
export async function requireUser(locale: string, path: string) {
  const user = await getCurrentUser();
  if (!user) return redirect({ href: { pathname: '/login', query: { next: path } }, locale });
  return user;
}

// Guard for owner-only pages. Renters get `gate: true` (the page renders the friendly
// "Become an owner" gate instead of an error); owners missing a phone or WhatsApp consent are
// sent to finish that first and come back to `path`.
export async function requireOwnerAccess(locale: string, path: string) {
  const user = await requireUser(locale, path);
  if (!isOwnerRole(user.role)) return { user, gate: true as const };
  if (!isOwnerReady(user)) {
    return redirect({ href: { pathname: '/become-owner', query: { next: safeRedirect(path) } }, locale });
  }
  return { user, gate: false as const };
}
