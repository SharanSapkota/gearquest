import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// The repo keeps a single .env at the root (shared with the API). Next.js only reads .env files
// from apps/web by itself, so load the root one too. Variables that are already set win.
const rootEnv = path.resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set: Google sign-in is disabled. Add it to the root .env.');
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@gearshare/shared'],
};

export default withNextIntl(nextConfig);
