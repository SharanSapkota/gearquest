'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { api, type Rental } from '@/lib/api';
import { apiErrorKey, needsPhone } from '@/lib/rentalErrors';

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
              <Button variant="secondary" disabled={busy} onClick={() => setConfirm('accept')}>
                {t('accept')}
              </Button>
            )}
            <Button variant="outline" disabled={busy} onClick={() => setConfirm('decline')}>
              {t('decline')}
            </Button>
          </>
        )}
        {canCancel && (
          <Button variant="outline" disabled={busy} onClick={() => void run('cancel')}>
            {t('cancel')}
          </Button>
        )}
        {canComplete && (
          <Button variant="secondary" disabled={busy} onClick={() => void run('complete')}>
            {t('complete')}
          </Button>
        )}
      </div>
      <Sheet
        variant="center"
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm ? t(`confirm.${confirm}Title`) : ''}
        footer={
          <>
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
              {t('confirm.back')}
            </Button>
            <Button
              variant={confirm === 'decline' ? 'danger' : 'secondary'}
              disabled={busy}
              onClick={() => confirm && void run(confirm)}
            >
              {confirm ? t(`confirm.${confirm}Yes`) : ''}
            </Button>
          </>
        }
      >
        {confirm && <p>{t(`confirm.${confirm}Text`)}</p>}
      </Sheet>
      {error != null && (
        <p role="alert" className="form-error">
          {tAll(`apiErrors.${apiErrorKey(error)}`)}{' '}
          {needsPhone(error) && <Link href="/profile/edit?become=owner">{tAll('gearForm.fixInProfile')}</Link>}
        </p>
      )}
    </div>
  );
}
