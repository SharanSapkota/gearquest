import { OWNER_ROLES } from '@gearshare/shared';
import type { Me, UserRole } from './api';
import { safeRedirect } from './safeRedirect';

export const isOwnerRole = (role: UserRole | undefined) =>
  (OWNER_ROLES as readonly string[]).includes(role ?? '');

// Mirrors the API rule: owners need a phone and WhatsApp consent before listing or accepting.
export const isOwnerReady = (user: Me) =>
  isOwnerRole(user.role) && Boolean(user.phone) && user.whatsappShareConsent;

// Where to go after signing in: onboarding first if unfinished, otherwise back where they came from.
export function afterLoginPath(user: Pick<Me, 'onboardingCompleted'>, next: string | null | undefined) {
  const target = safeRedirect(next);
  if (user.onboardingCompleted) return target;
  return target === '/' ? '/onboarding' : `/onboarding?next=${encodeURIComponent(target)}`;
}
