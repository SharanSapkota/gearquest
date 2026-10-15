'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { IconButton } from '@/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';

// Swipeable on touch devices via CSS scroll-snap; arrows and dots serve mouse/keyboard users.
export function GearGallery({ images, title }: { images: string[]; title: string }) {
  const t = useTranslations('gearDetail');
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return <div className="gallery__empty">{t('noPhotos')}</div>;
  }

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="gallery" role="group" aria-roledescription="carousel" aria-label={t('gallery')}>
      <ul
        ref={track}
        className="gallery__track"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((src, i) => (
          <li key={src} className="gallery__slide">
            <div className="media">
              {/* Gear photos are arbitrary user URLs, so they skip the optimiser. */}
              <Image
                src={src}
                alt={`${title} (${i + 1}/${images.length})`}
                fill
                sizes="(min-width: 900px) 700px, 100vw"
                priority={i === 0}
                unoptimized
              />
            </div>
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <>
          <IconButton
            label={t('previousPhoto')}
            variant="float"
            className="gallery__nav gallery__nav--prev"
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            label={t('nextPhoto')}
            variant="float"
            className="gallery__nav gallery__nav--next"
            onClick={() => goTo(Math.min(images.length - 1, index + 1))}
            disabled={index === images.length - 1}
          >
            <ChevronRightIcon />
          </IconButton>
          <div className="gallery__dots">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={i === index ? 'gallery__dot gallery__dot--on' : 'gallery__dot'}
                onClick={() => goTo(i)}
                aria-label={t('photoN', { n: i + 1 })}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
