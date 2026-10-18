'use client';

import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Field';
import { PHONE_PREFIX } from '@/lib/phone';

export { PHONE_PREFIX, cleanPhone } from '@/lib/phone';

// Finnish-friendly phone field: phone keypad, autofill, and +358 filled in on focus when empty.
// Validation and E.164 normalization use toE164 from @gearshare/shared (same as the API).
export function PhoneInput({
  value,
  onValueChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Input
      {...rest}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+358 40 123 4567"
      value={value}
      onFocus={(e) => {
        if (e.target.value === '') onValueChange(PHONE_PREFIX);
        rest.onFocus?.(e);
      }}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}
