'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Link, useRouter } from '@/i18n/navigation';
import { api, type Rental } from '@/lib/api';
import { apiErrorKey } from '@/lib/rentalErrors';

type Action = 'accept' | 'decline' | 'cancel' | 'complete';

// `ended` is computed on the server from the rental's end time.
export function RentalActions({ rental, ended }: { rental: Rental; ended: boolean }) {
  const t = useTranslations('rentals');
  const tAll = useTranslations();
  const router = useRouter();
  const me = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [confirm, setConfirm] = useState<'accept' | 'decline' | null>(null);

  const isOwner = rental.role === 'owner';
  const canDecide = isOwner && rental.status === 'requested';
  const canCancel =
    rental.role === 'renter'
      ? rental.status === 'requested' || (rental.status === 'accepted' && !ended)
      : rental.status === 'accepted' && !ended;
  const canComplete = rental.status === 'accepted' && ended;
  const ownerNeedsPhone = canDecide && !me?.phone;

  if (!canDecide && !canCancel && !canComplete) return null;

  const run = async (action: Action) => {
    setBusy(true);
    setError(null);
    try {
      await api.rentalAction(rental.id, action);
      setConfirm(null);
      router.refresh(); // refetch instead of updating locally
    } catch (err) {
      setError(err);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rental-actions">
      {ownerNeedsPhone && (
        <p className="note">
          {t('ownerPhoneNeeded')} <Link href="/profile/edit">{t('addPhone')}</Link>
        </p>
      )}
      <div className="rental-actions__buttons">
        {canDecide && (
          <>
            {!ownerNeedsPhone && (
              <button type="button" disabled={busy} onClick={() => setConfirm('accept')}>
                {t('accept')}
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => setConfirm('decline')}>
              {t('decline')}
            </button>
          </>
        )}
        {canCancel && (
          <button type="button" disabled={busy} onClick={() => void run('cancel')}>
            {t('cancel')}
          </button>
        )}
        {canComplete && (
          <button type="button" disabled={busy} onClick={() => void run('complete')}>
            {t('complete')}
          </button>
        )}
      </div>
      {confirm && (
        <div className="my-gear__confirm" role="alertdialog" aria-label={t(`confirm.${confirm}Title`)}>
          <p>{t(`confirm.${confirm}Text`)}</p>
          <button type="button" disabled={busy} onClick={() => void run(confirm)}>
            {t(`confirm.${confirm}Yes`)}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirm(null)}>
            {t('confirm.back')}
          </button>
        </div>
      )}
      {error != null && (
        <p role="alert" className="form-error">
          {tAll(`apiErrors.${apiErrorKey(error)}`)}
        </p>
      )}
    </div>
  );
}
