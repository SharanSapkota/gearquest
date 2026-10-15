'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

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
            {/* Gear images are arbitrary Cloudinary URLs, so next/image remote config does not apply. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${title} (${i + 1}/${images.length})`} loading={i === 0 ? 'eager' : 'lazy'} />
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="gallery__nav gallery__nav--prev"
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
            aria-label={t('previousPhoto')}
          >
            ‹
          </button>
          <button
            type="button"
            className="gallery__nav gallery__nav--next"
            onClick={() => goTo(Math.min(images.length - 1, index + 1))}
            disabled={index === images.length - 1}
            aria-label={t('nextPhoto')}
          >
            ›
          </button>
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
