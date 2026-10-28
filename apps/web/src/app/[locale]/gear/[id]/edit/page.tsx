import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageTitle } from '@/lib/metadata';
import { GearForm } from '@/components/gear/GearForm';
import { api } from '@/lib/api';
import { OwnerGate } from '@/components/dashboard/OwnerGate';
import { requireOwnerAccess } from '@/lib/auth';

export const generateMetadata = pageTitle('gearForm.editTitle');

export default async function EditGearPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const access = await requireOwnerAccess(locale, `/gear/${id}/edit`);
  if (access.gate) return <OwnerGate next={`/gear/${id}/edit`} />;
  // The list holds only the caller's own gear, so someone else's (or a missing) id is a 404.
  const { items } = await api.getMyGear();
  const gear = items.find((g) => g.id === id);
  if (!gear) notFound();
  const t = await getTranslations('gearForm');
  return (
    <main className="page page--form">
      <h1>{t('editTitle')}</h1>
      <GearForm gear={gear} />
    </main>
  );
}
