'use client';

import { useTranslations } from 'next-intl';
import type { UserRole } from '@gearquest/shared';
import { BackpackIcon, CheckIcon, HandshakeIcon, TentIcon } from '@/components/ui/icons';

// Two large cards (renter / owner) plus a small "both" option. Used by signup and signup/complete.
export function RoleCards({
  value,
  onChange,
  error,
}: {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  error?: boolean;
}) {
  const t = useTranslations('signup');
  const cards = [
    ['renter', <BackpackIcon key="r" size={26} />, t('roleRenter'), t('roleRenterBody')],
    ['owner', <TentIcon key="o" size={26} />, t('roleOwner'), t('roleOwnerBody')],
  ] as const;
  return (
    <div className="form">
      <fieldset className="role-cards">
        <legend className="sr-only">{t('roleTitle')}</legend>
        {cards.map(([role, icon, title, body]) => (
          <label key={role} className="role-card">
            <input
              type="radio"
              name="role"
              value={role}
              className="sr-only"
              checked={value === role}
              onChange={() => onChange(role)}
            />
            <span className="role-card__icon">{icon}</span>
            <strong>{title}</strong>
            <span>{body}</span>
            <CheckIcon size={22} className="role-card__check" />
          </label>
        ))}
      </fieldset>
      <label className="role-both">
        <input
          type="radio"
          name="role"
          value="both"
          checked={value === 'both'}
          onChange={() => onChange('both')}
        />
        <HandshakeIcon size={20} />
        {t('roleBoth')}
      </label>
      {value === 'both' && <p className="note">{t('roleBothSelected')}</p>}
      {error && (
        <p role="alert" className="form-error">
          {t('roleRequired')}
        </p>
      )}
    </div>
  );
}
