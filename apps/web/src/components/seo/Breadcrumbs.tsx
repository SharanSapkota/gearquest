import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { JsonLd } from './JsonLd';

export type Crumb = { name: string; path: string }; // path: locale-prefixed, e.g. /fi/varusteet/sukset

// Visible breadcrumb trail plus the matching BreadcrumbList JSON-LD. The last crumb is the current page.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations('breadcrumb');
  return (
    <>
      <nav className="crumbs" aria-label={t('label')}>
        <ol>
          {items.map((c, i) => (
            <li key={c.path}>
              {i < items.length - 1 ? (
                <NextLink href={c.path}>{c.name}</NextLink>
              ) : (
                <span aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
