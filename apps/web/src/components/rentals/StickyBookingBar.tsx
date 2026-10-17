'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

// Phone-only bar above the tab bar: price + "Request". Hides while the booking card is on screen.
export function StickyBookingBar({ price }: { price: string }) {
  const t = useTranslations('gearDetail');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById('booking');
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry?.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  if (!visible) return null;
  return (
    <div className="bookbar">
      <p className="bookbar__price price">{price}</p>
      <Button
        size="md"
        onClick={() => {
          const el = document.getElementById('booking');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      >
        {t('requestShort')}
      </Button>
    </div>
  );
}
