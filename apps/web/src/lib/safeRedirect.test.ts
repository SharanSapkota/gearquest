import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it.each([
    ['/rentals', '/rentals'],
    ['/gear/123?tab=photos#top', '/gear/123?tab=photos#top'],
    ['/en/rentals', '/rentals'],
    ['/fi', '/'],
    ['/finland-trip', '/finland-trip'],
  ])('keeps the relative path %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });

  it.each([
    'https://evil.example',
    'http://evil.example/rentals',
    '//evil.example',
    '///evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'data:text/html,hi',
    ' /rentals',
    '/\t/evil.example',
    'rentals',
    '',
    undefined,
    null,
    42,
  ])('rejects %j', (input) => {
    expect(safeRedirect(input)).toBe('/');
  });

  it('uses the given fallback and the first of repeated params', () => {
    expect(safeRedirect('https://evil.example', '/onboarding')).toBe('/onboarding');
    expect(safeRedirect(['/rentals', 'https://evil.example'])).toBe('/rentals');
  });
});
