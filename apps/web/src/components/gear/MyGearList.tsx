'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GearImage } from '@/components/ui/GearImage';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Link, useRouter } from '@/i18n/navigation';
import { api, type OwnerGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export function MyGearList({ initial }: { initial: OwnerGear[] }) {
  const t = useTranslations('myGear');
  const tAll = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
      router.refresh();
    } catch {
      toast(t('actionFailed'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const toggle = (gear: OwnerGear) =>
    run(gear.id, async () => {
      const status = gear.status === 'active' ? 'paused' : 'active';
      await api.updateGear(gear.id, { status });
      setItems((list) => list.map((g) => (g.id === gear.id ? { ...g, status } : g)));
    });

  const remove = (id: string) =>
    run(id, async () => {
      await api.deleteGear(id);
      setItems((list) => list.filter((g) => g.id !== id));
      setConfirmId(null);
    });

  if (items.length === 0) {
    return (
      <EmptyState
        action={
          <Link href="/gear/new" className={buttonClass()}>
            {t('add')}
          </Link>
        }
      >
        {t('empty')}
      </EmptyState>
    );
  }

  const confirming = items.find((g) => g.id === confirmId);

  return (
    <>
      <ul className="my-gear">
        {items.map((gear) => {
          const { hourlyCents, dailyCents } = gear.pricing;
          const busy = busyId === gear.id;
          return (
            <li key={gear.id} className="my-gear__item">
              <GearImage
                src={gear.images[0]}
                alt=""
                sizes="(min-width: 640px) 180px, 100vw"
                className="my-gear__image"
                emptyLabel={tAll('gear.noImage')}
              />
              <div className="my-gear__body">
                <h2 className="card__title">
                  <Link href={`/gear/${gear.id}`}>{gear.title}</Link>
                </h2>
                <p className="card__meta">
                  {tAll(`categories.${gear.category}`)} · {gear.city}
                </p>
                <p className="card__price">
                  {hourlyCents !== undefined && (
                    <span>{tAll('gear.perHour', { price: formatMoney(hourlyCents, locale) })}</span>
                  )}
                  {dailyCents !== undefined && (
                    <span>{tAll('gear.perDay', { price: formatMoney(dailyCents, locale) })}</span>
                  )}
                </p>
                <Badge tone={gear.status}>{t(`status.${gear.status}`)}</Badge>
              </div>
              <div className="my-gear__actions">
                <Link href={`/gear/${gear.id}/edit`} className={buttonClass({ variant: 'outline', size: 'sm' })}>
                  {t('edit')}
                </Link>
                <Button variant="outline" size="sm" onClick={() => void toggle(gear)} disabled={busy}>
                  {gear.status === 'active' ? t('pause') : t('activate')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmId(gear.id)} disabled={busy}>
                  {t('delete')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <Sheet
        variant="center"
        open={!!confirming}
        onClose={() => setConfirmId(null)}
        title={t('confirmTitle')}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmId(null)} disabled={!!busyId}>
              {t('cancel')}
            </Button>
            <Button variant="danger" onClick={() => confirming && void remove(confirming.id)} disabled={!!busyId}>
              {t('confirmDelete')}
            </Button>
          </>
        }
      >
        {confirming && <p>{t('confirmText', { title: confirming.title })}</p>}
      </Sheet>
    </>
  );
}
