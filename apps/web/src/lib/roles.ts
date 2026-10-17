import type { Me } from './api';

export const isOwner = (user: Pick<Me, 'role'> | null | undefined) =>
  user?.role === 'owner' || user?.role === 'both';

// What an owner needs on file before listing gear or accepting requests (enforced by the API too).
export const isOwnerReady = (user: Me | null | undefined) =>
  isOwner(user) && Boolean(user?.phone) && Boolean(user?.whatsappShareConsent);
