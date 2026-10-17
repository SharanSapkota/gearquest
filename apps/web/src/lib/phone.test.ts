import { describe, expect, it } from 'vitest';
import { cleanPhone, toE164 } from './phone';

describe('phone', () => {
  it('normalizes Finnish numbers to E.164', () => {
    expect(toE164('040 123 4567')).toBe('+358401234567');
    expect(toE164('+358 40 123 4567')).toBe('+358401234567');
  });
  it('rejects invalid numbers and the bare prefix', () => {
    expect(toE164('+358 ')).toBeNull();
    expect(toE164('123')).toBeNull();
  });
  it('treats the default prefix as empty', () => {
    expect(cleanPhone(' +358 ')).toBe('');
    expect(cleanPhone('+358 40')).toBe('+358 40');
  });
});
