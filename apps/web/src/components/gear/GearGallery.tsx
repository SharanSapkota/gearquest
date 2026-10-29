'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ImageIcon } from '@/components/ui/icons';
import { Sheet } from '@/components/ui/Sheet';

const BENTO_MAX = 5;

// Desktop: bento grid (1 large + up to 4 small). Phones: full-bleed swipe carousel (CSS scroll-snap).
// Photos beyond the bento open in a sheet.
export function GearGallery({ images, altBase }: { images: string[]; altBase: string }) {
  const t = useTranslations('gearDetail');
  const [index, setIndex] = useState(0);
  const [all, setAll] = useState(false);

  if (images.length === 0) {
    return (
      <div className="gallery gallery__empty contour">
        <ImageIcon size={36} />
        {t('noPhotos')}
      </div>
    );
  }

  // Descriptive, localized alt text: the title, category and city, plus the photo number.
  const alt = (i: number) => `${altBase} (${i + 1}/${images.length})`;
  const shown = images.slice(0, BENTO_MAX);

  return (
    <section className="gallery" aria-label={t('gallery')}>
      <div className={`gallery__bento gallery__bento--${shown.length}`}>
        {shown.map((src, i) => (
          <div key={src} className="gallery__tile media">
            {/* Gear photos are arbitrary user URLs, so they skip the optimiser. */}
            <Image
              src={src}
              alt={alt(i)}
              fill
              sizes={i === 0 ? '(min-width: 1536px) 50vw, 55vw' : '25vw'}
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}
        {images.length > 1 && (
          <Button variant="outline" size="sm" className="gallery__all" onClick={() => setAll(true)} aria-haspopup="dialog">
            <ImageIcon size={16} />
            {t('showAll')}
          </Button>
        )}
      </div>

      <div className="gallery__carousel" role="group" aria-roledescription="carousel" aria-label={t('gallery')}>
        <ul
          className="gallery__track"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((src, i) => (
            <li key={src} className="gallery__slide">
              <div className="media">
                <Image src={src} alt={alt(i)} fill sizes="100vw" priority={i === 0} unoptimized />
              </div>
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <span className="gallery__count num" aria-hidden="true">
            {t('photoCounter', { current: Math.min(index + 1, images.length), total: images.length })}
          </span>
        )}
      </div>

      {all && (
        <Sheet variant="wide" open onClose={() => setAll(false)} title={t('gallery')}>
          <div className="gallery__all-list">
            {images.map((src, i) => (
              <div key={src} className="media">
                <Image src={src} alt={alt(i)} fill sizes="(min-width: 768px) 900px, 100vw" unoptimized />
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </section>
  );
}
