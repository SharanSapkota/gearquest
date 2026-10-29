import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { finnishLegacyRedirects, finnishRewrites, PRIVATE_HEADER_SOURCES } from './src/lib/seo/routes';
import { isIndexable } from './src/lib/siteUrl';

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
  // Belt and braces next to the metadata robots tag: private pages, and every page of a
  // non-indexable (non-production) deployment, are noindex at the HTTP level too.
  async headers() {
    const headers = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    const sources = isIndexable() ? PRIVATE_HEADER_SOURCES : ['/:path*'];
    return sources.map((source) => ({ source, headers }));
  },
  // Old Finnish URLs that used the English path (/fi/gear/<id>) redirect permanently.
  async redirects() {
    return finnishLegacyRedirects();
  },
};

export default withNextIntl(nextConfig);
