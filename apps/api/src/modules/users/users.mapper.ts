import type { UserRecord } from './users.repository';

// Public view: whitelist only. Never phone, email or googleId.
export function toPublicUser(user: UserRecord) {
  return {
    id: String(user._id),
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    ratingAvg: user.ratingAvg,
    ratingCount: user.ratingCount,
  };
}

// Private view: only for the caller's own account (/auth/me, PATCH /users/me). Never googleId.
export function toPrivateUser(user: UserRecord) {
  return {
    ...toPublicUser(user),
    email: user.email,
    phone: user.phone,
    language: user.language,
    role: user.role ?? undefined,
    whatsappShareConsent: Boolean(user.whatsappShareConsent),
    termsAccepted: Boolean(user.termsAcceptedAt),
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
  };
}
