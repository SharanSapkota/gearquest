import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GearForm } from '@/components/gear/GearForm';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function NewGearPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/', locale });
  const t = await getTranslations('gearForm');
  return (
    <main className="page">
      <h1>{t('createTitle')}</h1>
      <GearForm />
    </main>
  );
}
