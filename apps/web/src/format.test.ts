import { describe, expect, it } from 'vitest';
import { formatDateTime } from './lib/format';

describe('formatDateTime', () => {
  it('renders UTC instants in Europe/Helsinki', () => {
    // 2026-01-15T10:00Z is 12:00 in Helsinki (UTC+2)
    expect(formatDateTime('2026-01-15T10:00:00Z', 'en')).toContain('12:00');
  });
});
