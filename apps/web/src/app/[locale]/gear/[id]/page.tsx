import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
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
import { ApiError, api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { formatMoney } from '@/lib/format';

export default async function GearDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // Non-404 errors propagate to error.tsx.
  const gear = await api.getGear(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  const me = await getCurrentUser();
  const isOwner = me?.id === gear.ownerId;
  const { hourlyCents, dailyCents, minHours } = gear.pricing;
  // The owner card shows the review count, which only the public profile carries.
  const ownerProfile = gear.owner ? await api.getUser(gear.owner.id).catch(() => null) : null;

  const prices = [
    hourlyCents !== undefined && t('gear.perHour', { price: formatMoney(hourlyCents, locale) }),
    dailyCents !== undefined && t('gear.perDay', { price: formatMoney(dailyCents, locale) }),
  ].filter(Boolean) as string[];

  return (
    <main className="detail">
      <div className="detail__top">
        <Link href="/" className="page__back">
          <ChevronLeftIcon size={18} />
          {t('gear.back')}
        </Link>
      </div>
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
