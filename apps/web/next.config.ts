import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { finnishLegacyRedirects, finnishRewrites } from './src/lib/seo/routes';

// The single .env lives at the repo root, but Next only reads .env files from apps/web.
// Load the root one first so NEXT_PUBLIC_* values are inlined into the client bundle.
loadEnvConfig(path.resolve(process.cwd(), '../..'), process.env.NODE_ENV !== 'production');

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    '\n[seo] NEXT_PUBLIC_SITE_URL is not set: canonicals, sitemap and OG URLs fall back to localhost and the site is served noindex.\n',
  );
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@gearquest/shared'],
  // Finnish URLs are localized (/fi/varuste/...); they map onto the English internal routes.
  async rewrites() {
    return { beforeFiles: finnishRewrites(), afterFiles: [], fallback: [] };
  },
  // Old Finnish URLs that used the English path (/fi/gear/<id>) redirect permanently.
  async redirects() {
    return finnishLegacyRedirects();
  },
};

export default withNextIntl(nextConfig);
