'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useRouter } from '@/i18n/navigation';
import { ApiError, api } from '@/lib/api';
import {
  afterLoginPath,
  emptyDraft,
  signupErrorFromCode,
  toSignupData,
  validateDraft,
  type SignupDraft,
  type SignupError,
} from '@/lib/roles';
import { RoleCards } from './RoleCards';
import { SignupDetails } from './SignupDetails';

// /signup/complete: reached after "Sign in" with a Google account that has no GearShare account.
// Name and avatar come from the verified Google profile (read-only); the user picks a role,
// accepts the terms and (owner/both) adds phone + consent. Only then is the account created.
export function CompleteSignupForm({
  profile,
  next,
}: {
  profile: { name: string; avatarUrl?: string };
  next?: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as 'fi' | 'en';
  const router = useRouter();
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
  const [error, setError] = useState<SignupError | null>(null);
  const [failed, setFailed] = useState<'expired' | 'generic' | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<SignupDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateDraft(draft);
    if (problem) return setError(problem);
    setSaving(true);
    setFailed(null);
    try {
      const res = await api.completeSignup(toSignupData(draft, locale));
      if (res.status !== 'OK') throw new Error('unexpected');
      router.replace(afterLoginPath(res.user, next));
      router.refresh();
    } catch (err) {
      const formError = err instanceof ApiError ? signupErrorFromCode(err.code) : undefined;
      if (formError) setError(formError);
      else setFailed(err instanceof ApiError && err.status === 401 ? 'expired' : 'generic');
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={(e) => void submit(e)} noValidate>
      <div className="profile-chip">
        <Avatar name={profile.name} url={profile.avatarUrl} size={48} />
        <div>
          <strong>{profile.name}</strong>
          <p className="note">{t('signup.googleAccount')}</p>
        </div>
      </div>
      <h2>{t('signup.roleTitle')}</h2>
      <RoleCards value={draft.role} onChange={(role) => patch({ role })} error={error === 'roleRequired'} />
      {draft.role && <SignupDetails draft={draft} onChange={patch} error={error} />}
      {failed && (
        <p role="alert" className="form-error">
          {failed === 'expired' ? t('signup.expired') : t('signup.createFailed')}
        </p>
      )}
      <Button type="submit" block disabled={saving}>
        {saving ? t('signup.creating') : t('signup.create')}
      </Button>
    </form>
  );
}
