import { cache } from 'react';
import { redirect } from '@/i18n/navigation';
import { api } from './api';

// Server-side current user, read once per request via the single API client.
export const getCurrentUser = cache(() => api.getMe());

// Guard for auth-required pages. `path` is the page's own locale-less path (with query), used to
// come back after signing in. Unfinished onboarding is completed first.
export async function requireUser(locale: string, path: string) {
  const user = await getCurrentUser();
  if (!user) return redirect({ href: { pathname: '/login', query: { next: path } }, locale });
  if (!user.onboardingCompleted) {
    return redirect({ href: { pathname: '/onboarding', query: { next: path } }, locale });
  }
  return user;
}
