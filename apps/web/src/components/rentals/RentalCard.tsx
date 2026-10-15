import { useLocale, useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
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
    <article className="rental-card">
      {rental.gear.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={rental.gear.coverImage} alt="" className="my-gear__image" />
      ) : (
        <div className="my-gear__image my-gear__image--empty">{tAll('gear.noImage')}</div>
      )}
      <div className="rental-card__body">
        <h2 className="card__title">
          <Link href={`/gear/${rental.gearId}`}>{rental.gear.title}</Link>
        </h2>
        <p className="card__meta">
          {formatDateTime(rental.startAt, locale)} – {formatDateTime(rental.endAt, locale)}
        </p>
        <p className="card__price">
          <span>{formatMoney(rental.totalCents, locale)}</span>
          <span className="card__meta">
            {t(rental.mode === 'hourly' ? 'quantityHours' : 'quantityDays', { count: rental.quantity })}
          </span>
        </p>
        <span className={`badge badge--${rental.status}`}>{t(`status.${rental.status}`)}</span>
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
          <span className="card__meta">
            {other.ratingCount > 0
              ? tAll('gear.rating', { rating: other.ratingAvg.toFixed(1) })
              : tAll('gear.noRating')}
          </span>
        </p>
        {rental.message && <p className="rental-card__message">“{rental.message}”</p>}
        {contact && (
          <div className="rental-card__contact">
            <p>
              {t('phone')}: <strong>{contact.phone}</strong>
            </p>
            <a href={contact.url} target="_blank" rel="noopener noreferrer" className="button">
              {t('whatsapp')}
            </a>
            <p className="note">{t('contactNote')}</p>
          </div>
        )}
        <RentalActions rental={rental} ended={ended} />
        {!detail && <Link href={`/rentals/${rental.id}`}>{t('viewDetails')}</Link>}
      </div>
    </article>
  );
}
