import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import NextLink from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CONTENT_UPDATED, GUIDES } from '@/content/pages';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo/metadata';
import { publicPath } from '@/lib/seo/paths';
import { isSeoLocale } from '@/lib/seo/routes';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return {};
  const [t, seo] = await Promise.all([getTranslations({ locale, namespace: 'guides' }), getTranslations({ locale, namespace: 'seo' })]);
  return buildMetadata({ locale, page: 'guides', title: t('title'), description: seo('guidesDescription') });
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <main className="page page--narrow prose">
      <Breadcrumbs
        items={[
          { name: t('nav.home'), path: publicPath('home', locale) },
          { name: t('guides.title'), path: publicPath('guides', locale) },
        ]}
      />
      <h1>{t('guides.title')}</h1>
      <p className="landing__answer">{t('guides.intro')}</p>
      <p className="landing__updated">{t('landing.updated', { date: formatDate(CONTENT_UPDATED, locale) })}</p>
      <ul className="guide-list">
        {GUIDES.map((g) => (
          <li key={g.slug.en}>
            <h2>
              <NextLink href={publicPath('guide', locale, { slug: g.slug[locale] })}>{g.title[locale]}</NextLink>
            </h2>
            <p>{g.description[locale]}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
