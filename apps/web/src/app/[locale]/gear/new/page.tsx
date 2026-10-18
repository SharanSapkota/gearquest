import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GearForm } from '@/components/gear/GearForm';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { HandshakeIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth';
import { isOwnerReady } from '@/lib/onboarding';

export default async function NewGearPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, '/gear/new');
  const t = await getTranslations();
  // Friendly gate instead of an API error: owners need a phone and WhatsApp consent on file.
  if (!isOwnerReady(user)) {
    return (
      <main className="page page--form">
        <EmptyState
          title={t('ownerGate.title')}
          icon={<HandshakeIcon size={34} />}
          action={
            <Link
              href={`/profile/edit?become=owner&next=${encodeURIComponent('/gear/new')}`}
              className={buttonClass()}
            >
              {t('ownerGate.profileAction')}
            </Link>
          }
        >
          {t('ownerGate.body')}
        </EmptyState>
      </main>
    );
  }
  return (
    <main className="page page--form">
      <h1>{t('gearForm.createTitle')}</h1>
      <GearForm />
    </main>
  );
}
