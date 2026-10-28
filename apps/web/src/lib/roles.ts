import { OWNER_ROLES, toE164, type SignupData, type UserRole } from '@gearquest/shared';
import type { Me } from './api';
import { cleanPhone } from './phone';
import { safeRedirect } from './safeRedirect';

export const isOwnerRole = (role: UserRole | undefined) =>
  (OWNER_ROLES as readonly string[]).includes(role ?? '');

// Mirrors the API rule: owners need a phone and WhatsApp consent before listing or accepting.
export const isOwnerReady = (user: Me) =>
  isOwnerRole(user.role) && Boolean(user.phone) && user.whatsappShareConsent;

// "both" users switch between the renting and hosting dashboards; the last one is remembered.
export type DashboardView = 'renter' | 'owner';
export const VIEW_COOKIE = 'gs_view';
export const DASHBOARD_PATHS: Record<DashboardView, string> = {
  renter: '/dashboard/renter',
  owner: '/dashboard/owner',
};
export const parseView = (value: string | undefined): DashboardView | undefined =>
  value === 'owner' || value === 'renter' ? value : undefined;

// Locale-less dashboard path for a user. Renters can never land on the hosting view.
export function dashboardFor(role: UserRole | undefined, lastView?: DashboardView) {
  if (role === 'owner') return DASHBOARD_PATHS.owner;
  if (role === 'both') return DASHBOARD_PATHS[lastView ?? 'renter'];
  return DASHBOARD_PATHS.renter;
}

// Where to go after signing in: a safe "return to" page if there is one, otherwise the dashboard.
// "both" goes through /dashboard, which knows the remembered view (cookie, read on the server).
export function afterLoginPath(user: Pick<Me, 'role'>, next: string | null | undefined) {
  const target = safeRedirect(next, '');
  if (target && target !== '/') return target;
  return user.role === 'both' ? '/dashboard' : dashboardFor(user.role);
}

export type SignupDraft = {
  role: UserRole | null;
  terms: boolean;
  phone: string;
  consent: boolean;
};
export type SignupError = 'roleRequired' | 'termsRequired' | 'phoneRequired' | 'phoneInvalid' | 'consentRequired';

export const emptyDraft: SignupDraft = { role: null, terms: false, phone: '', consent: false };

// The same rules the API enforces, so users get an inline message before the request is sent.
export function validateOwnerContact(phone: string, consent: boolean): SignupError | null {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return 'phoneRequired';
  if (!toE164(cleaned)) return 'phoneInvalid';
  if (!consent) return 'consentRequired';
  return null;
}

export function validateDraft(draft: SignupDraft): SignupError | null {
  if (!draft.role) return 'roleRequired';
  if (!draft.terms) return 'termsRequired';
  return isOwnerRole(draft.role) ? validateOwnerContact(draft.phone, draft.consent) : null;
}

// Only the fields the API accepts. Role is chosen by the user; identity comes from Google.
export function toSignupData(draft: SignupDraft, language: 'fi' | 'en'): SignupData {
  if (!draft.role) throw new Error('role missing');
  const owner = isOwnerRole(draft.role);
  return {
    role: draft.role,
    termsAccepted: draft.terms,
    language,
    ...(owner && { phone: cleanPhone(draft.phone), whatsappShareConsent: draft.consent }),
  };
}

// API error code -> inline form error.
const API_SIGNUP_ERRORS: Record<string, SignupError> = {
  PHONE_REQUIRED: 'phoneRequired',
  CONSENT_REQUIRED: 'consentRequired',
  'users.invalidPhone': 'phoneInvalid',
  'auth.termsRequired': 'termsRequired',
};
export const signupErrorFromCode = (code: string | undefined) =>
  (code && API_SIGNUP_ERRORS[code]) || undefined;
