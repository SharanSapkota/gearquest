'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { api, type OwnerGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export function MyGearList({ initial }: { initial: OwnerGear[] }) {
  const t = useTranslations('myGear');
  const tAll = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setErrorId(null);
    try {
      await action();
      router.refresh();
    } catch {
      setErrorId(id);
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
      <div className="state">
        <p>{t('empty')}</p>
        <Link href="/gear/new">{t('add')}</Link>
      </div>
    );
  }

  return (
    <ul className="my-gear">
      {items.map((gear) => {
        const { hourlyCents, dailyCents } = gear.pricing;
        const busy = busyId === gear.id;
        return (
          <li key={gear.id} className="my-gear__item">
            {gear.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gear.images[0]} alt="" className="my-gear__image" />
            ) : (
              <div className="my-gear__image my-gear__image--empty">{tAll('gear.noImage')}</div>
            )}
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
              <span className={`badge badge--${gear.status}`}>{t(`status.${gear.status}`)}</span>
            </div>
            <div className="my-gear__actions">
              <Link href={`/gear/${gear.id}/edit`}>{t('edit')}</Link>
              <button type="button" onClick={() => void toggle(gear)} disabled={busy}>
                {gear.status === 'active' ? t('pause') : t('activate')}
              </button>
              <button type="button" onClick={() => setConfirmId(gear.id)} disabled={busy}>
                {t('delete')}
              </button>
            </div>
            {confirmId === gear.id && (
              <div className="my-gear__confirm" role="alertdialog" aria-label={t('confirmTitle')}>
                <p>{t('confirmText', { title: gear.title })}</p>
                <button type="button" onClick={() => void remove(gear.id)} disabled={busy}>
                  {t('confirmDelete')}
                </button>
                <button type="button" onClick={() => setConfirmId(null)} disabled={busy}>
                  {t('cancel')}
                </button>
              </div>
            )}
            {errorId === gear.id && (
              <p role="alert" className="my-gear__error">
                {t('actionFailed')}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
