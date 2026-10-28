// The seed writes fake users and listings. It may only ever touch a local development database.
export function assertSeedAllowed(env: { NODE_ENV?: string; MONGODB_URI?: string }): string {
  if (env.NODE_ENV === 'production') throw new Error('seed-dev refuses to run with NODE_ENV=production.');
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');
  let host: string;
  try {
    host = new URL(uri).hostname;
  } catch {
    throw new Error('MONGODB_URI is not a valid URI.');
  }
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
    throw new Error('seed-dev only runs against a local MongoDB (localhost / 127.0.0.1).');
  }
  return uri;
}
