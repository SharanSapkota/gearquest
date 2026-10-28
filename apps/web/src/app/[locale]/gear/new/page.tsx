import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageTitle } from '@/lib/metadata';
import { OwnerGate } from '@/components/dashboard/OwnerGate';
import { GearForm } from '@/components/gear/GearForm';
import { requireOwnerAccess } from '@/lib/auth';

export const generateMetadata = pageTitle('gearForm.createTitle');

export default async function NewGearPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Renters get the friendly "Become an owner" gate; owners without phone or consent are sent to
  // add them first and come back here.
  const access = await requireOwnerAccess(locale, '/gear/new');
  if (access.gate) return <OwnerGate next="/gear/new" />;
  const t = await getTranslations('gearForm');
  return (
    <main className="page page--form">
      <h1>{t('createTitle')}</h1>
      <GearForm />
    </main>
  );
}
