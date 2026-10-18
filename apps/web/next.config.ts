import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// The single .env lives at the repo root, but Next only reads .env files from apps/web.
// Load the root one first so NEXT_PUBLIC_* values are inlined into the client bundle.
loadEnvConfig(path.resolve(process.cwd(), '../..'), process.env.NODE_ENV !== 'production');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@gearshare/shared'],
};

export default withNextIntl(nextConfig);
