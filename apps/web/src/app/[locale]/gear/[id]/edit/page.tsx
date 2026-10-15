import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GearForm } from '@/components/gear/GearForm';
import { redirect } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export default async function EditGearPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/', locale });
  // The list holds only the caller's own gear, so someone else's (or a missing) id is a 404.
  const { items } = await api.getMyGear();
  const gear = items.find((g) => g.id === id);
  if (!gear) notFound();
  const t = await getTranslations('gearForm');
  return (
    <main className="page">
      <h1>{t('editTitle')}</h1>
      <GearForm gear={gear} />
    </main>
  );
}
