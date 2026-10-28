import { describe, expect, it } from 'vitest';
import { assertSeedAllowed } from './seedGuard';

describe('assertSeedAllowed', () => {
  it('refuses production', () => {
    expect(() => assertSeedAllowed({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://localhost/x' })).toThrow(
      /production/,
    );
  });
  it('refuses non-local databases', () => {
    expect(() => assertSeedAllowed({ MONGODB_URI: 'mongodb+srv://u:p@cluster.mongodb.net/x' })).toThrow(/local/);
  });
  it('refuses a missing or malformed URI', () => {
    expect(() => assertSeedAllowed({})).toThrow();
    expect(() => assertSeedAllowed({ MONGODB_URI: 'nope' })).toThrow();
  });
  it('allows local development', () => {
    expect(assertSeedAllowed({ NODE_ENV: 'development', MONGODB_URI: 'mongodb://localhost:27017/x?replicaSet=rs0' })).toContain(
      'localhost',
    );
  });
});
