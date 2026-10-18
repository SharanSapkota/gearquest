import { OWNER_ROLES } from '@gearshare/shared';
import { AppError } from '../../lib/errors';

type OwnerFields = { phone?: string | null; whatsappShareConsent?: boolean | null };

export const isOwnerRole = (role: string | null | undefined) =>
  (OWNER_ROLES as readonly string[]).includes(role ?? '');

// An owner needs a phone and WhatsApp consent on file before listing gear or accepting a rental.
// Consent is permission to reveal the number after acceptance; it never makes the number public.
export function assertOwnerReady(user: OwnerFields | null | undefined) {
  if (!user?.phone) throw new AppError(409, 'users.phoneRequired');
  if (!user.whatsappShareConsent) throw new AppError(409, 'users.consentRequired');
}
