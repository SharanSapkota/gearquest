import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Link } from '@/i18n/navigation';
import type { GearDetail } from '@/lib/api';

// Public owner info only: never phone or email.
export function OwnerCard({ owner }: { owner: NonNullable<GearDetail['owner']> }) {
  const t = useTranslations();
  return (
    <section className="owner-card" aria-label={t('gearDetail.owner')}>
      <Avatar name={owner.name} url={owner.avatarUrl} size={48} />
      <div>
        <Link href={`/users/${owner.id}`}>
          <strong>{owner.name}</strong>
        </Link>
        <p className="card__rating">
          {owner.rating ? t('gear.rating', { rating: owner.rating.toFixed(1) }) : t('gear.noRating')}
        </p>
      </div>
    </section>
  );
}
