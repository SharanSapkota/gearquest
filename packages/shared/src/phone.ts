import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Finnish national numbers (040 123 4567) and international numbers, as E.164 (+358401234567).
// Returns null when the input is not a valid number. Shared so the web form and the API agree.
export function toE164(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input, 'FI');
  return parsed?.isValid() ? parsed.number : null;
}
