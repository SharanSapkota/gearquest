import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const PHONE_PREFIX = '+358 ';

// What the user typed, or '' when it is empty or only the default +358 prefix.
export const cleanPhone = (input: string) => {
  const value = input.trim();
  return value.replace(/\s/g, '') === PHONE_PREFIX.trim() ? '' : value;
};

// E.164 for a valid Finnish or international number, otherwise null. The API re-validates.
export function toE164(input: string): string | null {
  const parsed = parsePhoneNumberFromString(cleanPhone(input), 'FI');
  return parsed?.isValid() ? parsed.number : null;
}
