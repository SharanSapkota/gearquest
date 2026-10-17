import type { USER_ROLES } from '@gearshare/shared';
import { AppError } from '../../lib/errors';

type Role = (typeof USER_ROLES)[number];

export const isOwnerRole = (role: Role | null | undefined) => role === 'owner' || role === 'both';

// An owner needs a phone and WhatsApp consent on file before listing gear or accepting a request.
// The consent only allows revealing the number after acceptance; it never makes it public.
export function assertOwnerReady(
  user: { phone?: string | null; whatsappShareConsent?: boolean | null } | null | undefined,
) {
  if (!user?.phone) throw new AppError(409, 'owner.phoneRequired');
  if (!user.whatsappShareConsent) throw new AppError(409, 'owner.consentRequired');
}
