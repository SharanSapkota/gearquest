import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it.each(['/', '/gear/123', '/rentals?role=owner', '/map?bbox=1,2,3,4#list'])('keeps %s', (path) => {
    expect(safeRedirect(path)).toBe(path);
  });

  it.each([
    'https://evil.example',
    'http://evil.example/gear',
    '//evil.example',
    '///evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'data:text/html,hi',
    'gear/123',
    '/\tgear',
    '/gear\n//evil.example',
    '',
    undefined,
    null,
  ])('rejects %s', (bad) => {
    expect(safeRedirect(bad)).toBe('/');
  });

  it('uses the given fallback', () => {
    expect(safeRedirect('https://evil.example', '/onboarding')).toBe('/onboarding');
  });
});
