import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HandshakeIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';

// What a renter sees on owner-only pages: a friendly gate, not an error.
export function OwnerGate({ next }: { next: string }) {
  const t = useTranslations('ownerGate');
  return (
    <main className="page page--form">
      <EmptyState
        title={t('title')}
        icon={<HandshakeIcon size={34} />}
        action={
          <Link
            href={{ pathname: '/become-owner', query: { next } }}
            className={buttonClass()}
          >
            {t('action')}
          </Link>
        }
      >
        {t('body')}
      </EmptyState>
    </main>
  );
}
