import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GearGrid } from '@/components/gear/GearGrid';
import { Pagination } from '@/components/gear/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FaqList } from '@/components/seo/FaqList';
import { LinkList } from '@/components/seo/LinkList';
import { CATEGORY_CONTENT, CITIES, LANDING_CATEGORIES } from '@/content/landing';
import { FAQ, CONTENT_UPDATED } from '@/content/pages';
import { Link } from '@/i18n/navigation';
import { formatDate, formatMoney } from '@/lib/format';
import { getLandingGear, getScopeFacets, LANDING_PAGE_SIZE } from '@/lib/landingData';
import { collectionPageJsonLd } from '@/lib/seo/jsonLd';
import { landingCopy } from '@/lib/seo/landing';
import { listingState } from '@/lib/seo/listing';
import { idSlug, localPath, publicPath } from '@/lib/seo/paths';
import type { ResolvedLanding, LandingSearch } from '@/lib/seo/landingRoute';

const MAX_RELATED = 8;

export async function LandingView({ r, search }: { r: ResolvedLanding; search: LandingSearch }) {
  const { locale, category, city } = r;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { page } = listingState(search);
  const copy = landingCopy({ category, city }, locale);
  const [res, facets] = await Promise.all([
    getLandingGear(category, city?.key, page),
    getScopeFacets(category, city?.key),
  ]);
  const path = publicPath(r.page, locale, r.pathParams);

  const crumbs = [{ name: t('nav.home'), path: publicPath('home', locale) }];
  if (category) {
    const catPath = publicPath('category', locale, { category: CATEGORY_CONTENT[category].slug[locale] });
    crumbs.push({ name: t(`categories.${category}`), path: catPath });
  }
  if (city) crumbs.push({ name: city.name, path: publicPath(category ? 'categoryCity' : 'city', locale, r.pathParams) });

  const dailyPrices = res.items.map((g) => g.pricing.dailyCents).filter((c): c is number => c !== undefined);
  const from = res.total > 0 && res.total <= LANDING_PAGE_SIZE && dailyPrices.length > 0 ? Math.min(...dailyPrices) : undefined;

  // Related links only point at pages that have gear (or at the category/city hubs themselves).
  const catLink = (c: (typeof LANDING_CATEGORIES)[number], cityKey?: string) => ({
    name: t(`categories.${c}`),
    path: cityKey
      ? publicPath('categoryCity', locale, { category: CATEGORY_CONTENT[c].slug[locale], city: cityKey })
      : publicPath('category', locale, { category: CATEGORY_CONTENT[c].slug[locale] }),
  });
  const cityLink = (key: string, name: string, categoryForCombo?: (typeof LANDING_CATEGORIES)[number]) => ({
    name,
    path: categoryForCombo
      ? publicPath('categoryCity', locale, { category: CATEGORY_CONTENT[categoryForCombo].slug[locale], city: key })
      : publicPath('city', locale, { city: key }),
  });
  const cityName = (key: string) => CITIES.find((c) => c.key === key)?.name ?? key;

  let related: { title: string; links: { name: string; path: string }[] }[];
  if (category && city) {
    related = [
      { title: t('landing.otherInCity', { city: city.name }), links: facets.categories.filter((c) => c !== category).map((c) => catLink(c, city.key)) },
      { title: t('landing.categoryElsewhere', { category: t(`categories.${category}`) }), links: [catLink(category), { name: city.name, path: publicPath('city', locale, { city: city.key }) }] },
    ];
  } else if (category) {
    const known = facets.cityKeys.filter((k) => CITIES.some((c) => c.key === k)).slice(0, MAX_RELATED);
    related = [
      { title: t('landing.cities'), links: (known.length ? known : CITIES.slice(0, MAX_RELATED).map((c) => c.key)).map((k) => cityLink(k, cityName(k), known.length ? category : undefined)) },
      { title: t('landing.otherCategories'), links: LANDING_CATEGORIES.filter((c) => c !== category).map((c) => catLink(c)) },
    ];
  } else {
    related = [
      { title: t('landing.inThisCity', { city: city?.name ?? '' }), links: facets.categories.map((c) => catLink(c, city?.key)) },
      { title: t('landing.otherCities'), links: CITIES.filter((c) => c.key !== city?.key).slice(0, MAX_RELATED).map((c) => cityLink(c.key, c.name)) },
    ];
  }

  const faq = category
    ? CATEGORY_CONTENT[category].faq.map((f) => ({ q: f.q[locale], a: f.a[locale] }))
    : FAQ.slice(1, 4).map((f) => ({ q: f.q[locale], a: f.a[locale] }));

  const listPath = localPath(r.page, locale, r.pathParams);

  return (
    <main className="page landing">
      <Breadcrumbs items={crumbs} />
      <h1>{copy.h1}</h1>
      <div className="landing__intro">
        {copy.intro.map((p) => (
          <p key={p.slice(0, 40)} className={p === copy.intro[0] ? 'landing__answer' : undefined}>
            {p}
          </p>
        ))}
        <p className="summary">
          <span className="num">{t('landing.count', { count: res.total })}</span>
          {from !== undefined && ` · ${t('landing.from', { price: formatMoney(from, locale) })}`}
        </p>
        <p className="landing__updated">{t('landing.updated', { date: formatDate(CONTENT_UPDATED, locale) })}</p>
      </div>

      <section className="landing__section" aria-labelledby="landing-list">
        <h2 id="landing-list">{t('landing.list')}</h2>
        {res.items.length > 0 ? (
          <>
            <GearGrid items={res.items} />
            <Pagination page={page} total={res.total} limit={LANDING_PAGE_SIZE} basePath={listPath} searchParams={{}} />
          </>
        ) : (
          <EmptyState
            title={t('landing.emptyTitle')}
            action={
              <>
                <Link href="/gear/new" className={buttonClass({ variant: 'accent' })}>
                  {t('landing.listYourGear')}
                </Link>
                <Link href="/" className={buttonClass({ variant: 'outline' })}>
                  {t('landing.browseAll')}
                </Link>
              </>
            }
          >
            {t('landing.emptyBody')}
          </EmptyState>
        )}
      </section>

      {related.map((g) => (
        <LinkList key={g.title} title={g.title} links={g.links} />
      ))}
      <FaqList title={t('landing.faqTitle')} items={faq} />
      <JsonLd
        data={collectionPageJsonLd({
          name: copy.h1,
          description: copy.intro[0] ?? copy.h1,
          path,
          locale,
          items: res.items.map((g) => ({
            name: g.title,
            path: publicPath('gear', locale, { id: idSlug(g.id, g.title) }),
            image: g.images[0],
          })),
        })}
      />
    </main>
  );
}
