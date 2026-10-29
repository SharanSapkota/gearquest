import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ChevronLeftIcon, PinIcon } from '@/components/ui/icons';
import { GearGallery } from '@/components/gear/GearGallery';
import { GearLocationMap } from '@/components/gear/GearLocationMap';
import { OwnerCard } from '@/components/gear/OwnerCard';
import { RentalRequestForm } from '@/components/rentals/RentalRequestForm';
import { StickyBookingBar } from '@/components/rentals/StickyBookingBar';
import { Link } from '@/i18n/navigation';
import { ApiError, api, type PublicGear } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { formatMoney } from '@/lib/format';
import { getGearCached } from '@/lib/metadata';
import { buildMetadata, fitDescription, ogImageUrl } from '@/lib/seo/metadata';
import { idSlug, parseIdSlug, publicPath } from '@/lib/seo/paths';
import { isSeoLocale, type SeoLocale } from '@/lib/seo/routes';
import type { Metadata } from 'next';

type Props = { params: Promise<{ locale: string; id: string }> };

const priceParts = (gear: PublicGear, locale: string, t: Awaited<ReturnType<typeof getTranslations>>) =>
  [
    gear.pricing.hourlyCents !== undefined && t('gear.perHour', { price: formatMoney(gear.pricing.hourlyCents, locale) }),
    gear.pricing.dailyCents !== undefined && t('gear.perDay', { price: formatMoney(gear.pricing.dailyCents, locale) }),
  ].filter(Boolean) as string[];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, id: param } = await params;
  if (!isSeoLocale(rawLocale)) return {};
  const locale = rawLocale;
  const gear = await getGearCached(parseIdSlug(param).id).catch(() => null);
  const t = await getTranslations({ locale });
  if (!gear) return { title: t('meta.gearFallback'), robots: { index: false, follow: false } };
  const prices = priceParts(gear, locale, t).join(' · ');
  const category = t(`categories.${gear.category}`);
  const intro = prices
    ? t('seo.gearIntro', { title: gear.title, city: gear.city, category, prices })
    : t('seo.gearIntroNoPrice', { title: gear.title, city: gear.city, category });
  return buildMetadata({
    locale,
    page: 'gear',
    params: { id: idSlug(gear.id, gear.title) },
    title: gear.title,
    description: fitDescription([intro, gear.description]),
    image: ogImageUrl(locale, { gearId: gear.id }),
    imageAlt: t('seo.imageAlt', { title: gear.title, category, city: gear.city }),
    // Only the owner can load a paused listing; it must never be indexed.
    noindex: gear.status !== 'active',
  });
}

export default async function GearDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: param } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { id, hasSlugForm } = parseIdSlug(param);
  // Non-404 errors propagate to error.tsx.
  const gear = await getGearCached(id).catch((err: unknown) => {
    if (err instanceof ApiError && (err.status === 404 || err.status === 410)) notFound();
    throw err;
  });
  // Bare id, outdated or missing slug: permanent redirect to the canonical URL.
  const canonical = idSlug(gear.id, gear.title);
  if (hasSlugForm && param !== canonical) {
    permanentRedirect(publicPath('gear', locale as SeoLocale, { id: canonical }));
  }
  const me = await getCurrentUser();
  const isOwner = me?.id === gear.ownerId;
  const { hourlyCents, minHours } = gear.pricing;
  // The owner card shows the review count, which only the public profile carries.
  const ownerProfile = gear.owner ? await api.getUser(gear.owner.id).catch(() => null) : null;

  const prices = priceParts(gear, locale, t);

  return (
    <main className="detail">
      <div className="detail__top">
        <Link href="/" className="page__back">
          <ChevronLeftIcon size={18} />
          {t('gear.back')}
        </Link>
      </div>
      {gear.status === 'paused' && (
        <p className="note" role="status">
          <Badge>{t('gearDetail.pausedBadge')}</Badge> {t('gearDetail.pausedBanner')}
        </p>
      )}
      <GearGallery images={gear.images} title={gear.title} />
      <div className="detail__cols">
        <div className="detail__main">
          <header className="detail__head">
            <h1>{gear.title}</h1>
            <div className="detail__facts">
              <Badge tone="primary">
                <CategoryIcon category={gear.category} size={14} />
                {t(`categories.${gear.category}`)}
              </Badge>
              <Badge tone="success">
                {t('gearDetail.condition')}: {t(`conditions.${gear.condition}`)}
              </Badge>
              <Badge>
                <PinIcon size={14} />
                {gear.city}
              </Badge>
            </div>
          </header>
          {gear.owner && <OwnerCard owner={gear.owner} ratingCount={ownerProfile?.ratingCount} />}
          {gear.description && (
            <section className="detail__section">
              <h2>{t('gearDetail.about')}</h2>
              <p className="detail__description">{gear.description}</p>
            </section>
          )}
          {gear.location && (
            <section className="detail__section">
              <h2>{t('gearDetail.location')}</h2>
              <GearLocationMap position={gear.location} label={t('gearDetail.mapLabel')} />
              <p className="note">{t('gearDetail.locationNote')}</p>
            </section>
          )}
        </div>
        <aside className="detail__side" id="booking">
          <div className="booking">
            <p className="booking__price price">
              {prices.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </p>
            {hourlyCents !== undefined && minHours !== undefined && minHours > 1 && (
              <p className="note">{t('rentalForm.minHours', { count: minHours })}</p>
            )}
            {isOwner ? (
              <Link href={`/gear/${gear.id}/edit`} className={buttonClass({ block: true })}>
                {t('myGear.edit')}
              </Link>
            ) : (
              <RentalRequestForm gear={gear} signedIn={!!me} />
            )}
          </div>
        </aside>
      </div>
      {!isOwner && <StickyBookingBar price={prices.join(' · ')} />}
    </main>
  );
}
