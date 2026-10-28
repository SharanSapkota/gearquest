import { OWNER_ROLES } from '@gearquest/shared';
import { AppError } from '../../lib/errors';

type OwnerFields = {
  role?: string | null;
  phone?: string | null;
  whatsappShareConsent?: boolean | null;
};

export const isOwnerRole = (role: string | null | undefined) =>
  (OWNER_ROLES as readonly string[]).includes(role ?? '');

// owner and both may list gear and decide on rental requests.
export function assertOwnerRole(user: Pick<OwnerFields, 'role'> | null | undefined) {
  if (!isOwnerRole(user?.role)) throw new AppError(403, 'ROLE_REQUIRED');
}

// An owner needs a phone and WhatsApp consent on file before listing gear or accepting a rental.
// Consent is permission to reveal the number after acceptance; it never makes the number public.
export function assertOwnerContact(user: Pick<OwnerFields, 'phone' | 'whatsappShareConsent'> | null | undefined) {
  if (!user?.phone) throw new AppError(409, 'PHONE_REQUIRED');
  if (!user.whatsappShareConsent) throw new AppError(409, 'CONSENT_REQUIRED');
}

export function assertOwnerReady(user: OwnerFields | null | undefined) {
  assertOwnerRole(user);
  assertOwnerContact(user);
}
