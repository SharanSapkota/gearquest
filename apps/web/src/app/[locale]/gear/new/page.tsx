import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GearForm } from '@/components/gear/GearForm';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HandshakeIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { isOwner, isOwnerReady, requireUser } from '@/lib/auth';

export default async function NewGearPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, '/gear/new');
  const t = await getTranslations();
  return (
    <main className="page page--form">
      <h1>{t('gearForm.createTitle')}</h1>
      {isOwnerReady(user) ? (
        <GearForm />
      ) : (
        // Friendly gate instead of an API error: the API rejects listings without phone + consent.
        <EmptyState
          icon={<HandshakeIcon size={34} />}
          title={t('gearGate.title')}
          action={
            <Link
              href={{ pathname: '/profile/edit', query: { role: isOwner(user) && user.role ? user.role : 'owner' } }}
              className={buttonClass()}
            >
              {t('gearGate.action')}
            </Link>
          }
        >
          {isOwner(user) ? t('gearGate.missingDetails') : t('gearGate.notOwner')}
        </EmptyState>
      )}
    </main>
  );
}
