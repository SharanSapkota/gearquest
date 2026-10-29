import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import NextLink from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { CATEGORY_CONTENT } from '@/content/landing';
import { CONTENT_UPDATED, guideBySlug } from '@/content/pages';
import { formatDate } from '@/lib/format';
import { articleJsonLd } from '@/lib/seo/jsonLd';
import { buildMetadata, ogImageUrl } from '@/lib/seo/metadata';
import { publicPath } from '@/lib/seo/paths';
import { isSeoLocale } from '@/lib/seo/routes';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const guide = guideBySlug(slug);
  if (!isSeoLocale(locale) || !guide) return {};
  return buildMetadata({
    locale,
    page: 'guide',
    params: (l) => ({ slug: guide.slug[l] }),
    title: guide.title[locale],
    description: guide.description[locale],
    type: 'article',
    image: ogImageUrl(locale, 'default'),
  });
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  const guide = guideBySlug(slug);
  if (!isSeoLocale(locale) || !guide) notFound();
  // /en/guides/<finnish slug> redirects to the canonical slug for this locale.
  if (slug !== guide.slug[locale]) permanentRedirect(publicPath('guide', locale, { slug: guide.slug[locale] }));
  setRequestLocale(locale);
  const t = await getTranslations();
  const path = publicPath('guide', locale, { slug: guide.slug[locale] });
  const related = CATEGORY_CONTENT[guide.related];
  return (
    <main className="page page--narrow prose">
      <Breadcrumbs
        items={[
          { name: t('nav.home'), path: publicPath('home', locale) },
          { name: t('guides.title'), path: publicPath('guides', locale) },
          { name: guide.title[locale], path },
        ]}
      />
      <article>
        <h1>{guide.title[locale]}</h1>
        <p className="landing__answer">{guide.answer[locale]}</p>
        <p className="landing__updated">
          {t('guides.byline')} · {t('landing.updated', { date: formatDate(CONTENT_UPDATED, locale) })}
        </p>
        {guide.sections.map((s) => (
          <section key={s.h2.en}>
            <h2>{s.h2[locale]}</h2>
            {s.body.map((p) => (
              <p key={p.en}>{p[locale]}</p>
            ))}
          </section>
        ))}
        <p>
          <NextLink href={publicPath('category', locale, { category: related.slug[locale] })}>
            {t('guides.browseRelated', { category: t(`categories.${guide.related}`) })}
          </NextLink>
        </p>
      </article>
      <JsonLd
        data={articleJsonLd({
          headline: guide.title[locale],
          description: guide.description[locale],
          path,
          locale,
          author: t('guides.author'),
          datePublished: CONTENT_UPDATED,
          dateModified: CONTENT_UPDATED,
          image: ogImageUrl(locale, 'default'),
        })}
      />
    </main>
  );
}
