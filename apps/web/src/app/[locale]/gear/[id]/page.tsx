import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/Button';
import { GearGallery } from '@/components/gear/GearGallery';
import { GearLocationMap } from '@/components/gear/GearLocationMap';
import { OwnerCard } from '@/components/gear/OwnerCard';
import { RentalRequestForm } from '@/components/rentals/RentalRequestForm';
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

  return (
    <main className="page gear-detail">
      <div className="gear-detail__main">
        <GearGallery images={gear.images} title={gear.title} />
        <h1>{gear.title}</h1>
        <div className="gear-detail__facts">
          <Badge tone="primary">{t(`categories.${gear.category}`)}</Badge>
          <Badge tone="success">
            {t('gearDetail.condition')}: {t(`conditions.${gear.condition}`)}
          </Badge>
          <Badge>{gear.city}</Badge>
        </div>
        <p className="card__price gear-detail__price">
          {hourlyCents !== undefined && (
            <span>{t('gear.perHour', { price: formatMoney(hourlyCents, locale) })}</span>
          )}
          {dailyCents !== undefined && (
            <span>{t('gear.perDay', { price: formatMoney(dailyCents, locale) })}</span>
          )}
        </p>
        {hourlyCents !== undefined && minHours !== undefined && minHours > 1 && (
          <p className="note">{t('rentalForm.minHours', { count: minHours })}</p>
        )}
        {gear.description && <p className="gear-detail__description">{gear.description}</p>}
        {gear.owner && <OwnerCard owner={gear.owner} />}
        {gear.location && (
          <section>
            <h2>{t('gearDetail.location')}</h2>
            <GearLocationMap position={gear.location} label={t('gearDetail.mapLabel')} />
            <p className="note">{t('gearDetail.locationNote')}</p>
          </section>
        )}
      </div>
      <aside className="gear-detail__side">
        {isOwner ? (
          <Link href={`/gear/${gear.id}/edit`} className={buttonClass()}>
            {t('myGear.edit')}
          </Link>
        ) : (
          <RentalRequestForm gear={gear} signedIn={!!me} />
        )}
      </aside>
      <Link href="/" className={buttonClass({ variant: 'ghost' })}>
        {t('gear.back')}
      </Link>
    </main>
  );
}
