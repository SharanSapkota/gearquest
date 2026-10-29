import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FaqList } from '@/components/seo/FaqList';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTENT_PAGES, CONTENT_UPDATED, type ContentPageKey } from '@/content/pages';
import { formatDate } from '@/lib/format';
import { faqPageJsonLd } from '@/lib/seo/jsonLd';
import { publicPath } from '@/lib/seo/paths';
import type { SeoLocale } from '@/lib/seo/routes';

// Static content page: one H1, a short quotable answer first, dated, sections as H2, optional FAQ
// (with FAQPage JSON-LD). Everything is in the initial HTML.
export async function ContentPageView({ pageKey, locale }: { pageKey: ContentPageKey; locale: SeoLocale }) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = CONTENT_PAGES[pageKey];
  const faq = (c.faq ?? []).map((f) => ({ q: f.q[locale], a: f.a[locale] }));
  return (
    <main className="page page--narrow prose">
      <Breadcrumbs
        items={[
          { name: t('nav.home'), path: publicPath('home', locale) },
          { name: c.title[locale], path: publicPath(pageKey, locale) },
        ]}
      />
      <article>
        <h1>{c.title[locale]}</h1>
        <p className="landing__answer">{c.answer[locale]}</p>
        <p className="landing__updated">{t('landing.updated', { date: formatDate(CONTENT_UPDATED, locale) })}</p>
        {c.sections.map((s) => (
          <section key={s.h2.en}>
            <h2>{s.h2[locale]}</h2>
            {s.body.map((p) => (
              <p key={p.en}>{p[locale]}</p>
            ))}
          </section>
        ))}
      </article>
      <FaqList title={t('landing.faqTitle')} items={faq} />
      {faq.length > 0 && <JsonLd data={faqPageJsonLd(faq.map((f) => ({ question: f.q, answer: f.a })))} />}
    </main>
  );
}
