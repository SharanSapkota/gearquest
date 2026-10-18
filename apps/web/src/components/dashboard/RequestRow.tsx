import { useLocale, useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { GearImage } from '@/components/ui/GearImage';
import { CalendarIcon } from '@/components/ui/icons';
import { RentalActions } from '@/components/rentals/RentalActions';
import { Link } from '@/i18n/navigation';
import type { Rental } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';

// A pending request on the owner dashboard, with Accept / Decline inline (RentalActions asks
// for confirmation and refreshes the page afterwards).
export function RequestRow({ rental }: { rental: Rental }) {
  const t = useTranslations('rentals');
  const tAll = useTranslations();
  const locale = useLocale();
  const name = rental.counterparty.name ?? t('unknownUser');
  return (
    <li className="request-row">
      <GearImage
        src={rental.gear.coverImage ?? undefined}
        alt=""
        sizes="96px"
        className="request-row__image"
        emptyLabel={tAll('gear.noImage')}
      />
      <div className="request-row__body">
        <h3 className="request-row__title">
          <Link href={`/rentals/${rental.id}`}>{rental.gear.title}</Link>
        </h3>
        <p className="card__meta rental-card__dates">
          <CalendarIcon size={14} />
          {formatDateTime(rental.startAt, locale)} – {formatDateTime(rental.endAt, locale)}
        </p>
        <p className="rental-card__party">
          <Avatar name={name} url={rental.counterparty.avatarUrl} size={24} />
          <Link href={`/users/${rental.counterparty.id}`}>{name}</Link>
          <strong className="price num">{formatMoney(rental.totalCents, locale)}</strong>
        </p>
      </div>
      <div className="request-row__actions">
        <RentalActions rental={rental} ended={false} />
      </div>
    </li>
  );
}
