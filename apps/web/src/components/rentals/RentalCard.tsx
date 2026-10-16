import { useLocale, useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/Button';
import { GearImage } from '@/components/ui/GearImage';
import { CalendarIcon, StarIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { Rental } from '@/lib/api';
import { formatDateTime, formatMoney, hoursUntil } from '@/lib/format';
import { RentalActions } from './RentalActions';

// `nowMs` comes from the page so server rendering stays deterministic per request.
export function RentalCard({
  rental,
  nowMs,
  detail = false,
}: {
  rental: Rental;
  nowMs: number;
  detail?: boolean;
}) {
  const t = useTranslations('rentals');
  const tAll = useTranslations();
  const locale = useLocale();
  const { counterparty: other } = rental;
  const ended = new Date(rental.endAt).getTime() <= nowMs;
  const expiresInHours =
    rental.role === 'owner' && rental.status === 'requested' ? hoursUntil(rental.expiresAt, nowMs) : null;
  // Rendered only if the API revealed them; the link is the API's own, never built here.
  const contact = other.phone && other.whatsappUrl ? { phone: other.phone, url: other.whatsappUrl } : null;
  const name = other.name ?? t('unknownUser');

  return (
    <article className={detail ? 'rental-card rental-card--detail' : 'rental-card'}>
      <div className="rental-card__media">
        <GearImage
          src={rental.gear.coverImage ?? undefined}
          alt=""
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
          className="rental-card__image"
          emptyLabel={tAll('gear.noImage')}
        />
        <span className="rental-card__status">
          <Badge tone={rental.status}>{t(`status.${rental.status}`)}</Badge>
        </span>
      </div>
      <div className="rental-card__body">
        <h2 className="rental-card__title">
          <Link href={`/gear/${rental.gearId}`}>{rental.gear.title}</Link>
        </h2>
        <p className="card__meta rental-card__dates">
          <CalendarIcon size={14} />
          {formatDateTime(rental.startAt, locale)} – {formatDateTime(rental.endAt, locale)}
        </p>
        <p className="rental-card__total">
          <strong className="price num">{formatMoney(rental.totalCents, locale)}</strong>
          <span className="card__meta">
            {t(rental.mode === 'hourly' ? 'quantityHours' : 'quantityDays', { count: rental.quantity })}
          </span>
        </p>
        {expiresInHours !== null && (
          <p className="note">
            {expiresInHours > 0 ? t('expiresIn', { hours: expiresInHours }) : t('expiresSoon')}
          </p>
        )}
        <p className="rental-card__party">
          <Avatar name={name} url={other.avatarUrl} size={24} />
          <span>
            {t(rental.role === 'owner' ? 'renter' : 'owner')}:{' '}
            <Link href={`/users/${other.id}`}>{name}</Link>
          </span>
          {other.ratingCount > 0 ? (
            <span className="rating">
              <StarIcon size={14} />
              {other.ratingAvg.toFixed(1)}
            </span>
          ) : (
            <span className="card__meta">{tAll('gear.noRating')}</span>
          )}
        </p>
        {rental.message && <p className="rental-card__message">“{rental.message}”</p>}
        {contact && (
          <div className="rental-card__contact">
            <p>
              {t('phone')}: <strong>{contact.phone}</strong>
            </p>
            <a href={contact.url} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary' })}>
              {t('whatsapp')}
            </a>
            <p className="note">{t('contactNote')}</p>
          </div>
        )}
        <RentalActions rental={rental} ended={ended} />
        {!detail && (
          <Link href={`/rentals/${rental.id}`} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            {t('viewDetails')}
          </Link>
        )}
      </div>
    </article>
  );
}
