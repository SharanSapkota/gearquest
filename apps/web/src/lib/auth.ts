import { cache } from 'react';
import { redirect } from '@/i18n/navigation';
import { api, type Me } from './api';

export { isOwner, isOwnerReady } from './roles';

// Server-side current user, read once per request via the single API client.
export const getCurrentUser = cache(() => api.getMe());

// Guard for pages that need a signed-in user. `path` is the locale-less path to come back to.
// Guests go to /login; users who have not finished onboarding go to /onboarding first.
export async function requireUser(
  locale: string,
  path: string,
  { allowIncompleteOnboarding = false } = {},
): Promise<Me> {
  const user = await getCurrentUser();
  if (!user) return redirect({ href: { pathname: '/login', query: { next: path } }, locale });
  if (!user.onboardingCompleted && !allowIncompleteOnboarding) {
    return redirect({ href: { pathname: '/onboarding', query: { next: path } }, locale });
  }
  return user;
}
