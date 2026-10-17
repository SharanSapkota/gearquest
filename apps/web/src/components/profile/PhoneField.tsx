'use client';

import { useTranslations } from 'next-intl';
import { Field, Input } from '@/components/ui/Field';
import { PHONE_PREFIX } from '@/lib/phone';

// Mobile number with a +358 default: an empty field gets the prefix on focus. Phone keyboard on mobile.
export function PhoneField({
  label,
  hint,
  error,
  value,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const t = useTranslations('profile');
  return (
    <Field label={label} hint={hint ?? t('phoneNote')} error={error}>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+358 40 123 4567"
        maxLength={30}
        required={required}
        aria-invalid={error ? true : undefined}
        value={value}
        onFocus={() => {
          if (!value.trim()) onChange(PHONE_PREFIX);
        }}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

// "Never public, only after acceptance" explainer shown next to the owner phone and consent.
export function PhonePrivacyNote({ title, text }: { title?: string; text: string }) {
  return (
    <div className="privacy-note">
      {title && <strong>{title}</strong>}
      <p>{text}</p>
    </div>
  );
}
