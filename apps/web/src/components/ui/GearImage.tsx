import Image from 'next/image';
import { ImageIcon } from './icons';

// Aspect-ratio box + next/image (lazy by default): no layout shift. Gear photos are arbitrary
// user-provided URLs, so they cannot go through the optimiser (no remote host allow-list).
// `hoverSrc` is an optional second photo that fades in when the card is hovered (desktop).
export function GearImage({
  src,
  hoverSrc,
  alt,
  sizes,
  className,
  priority,
  ratio,
  emptyLabel,
}: {
  src?: string;
  hoverSrc?: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  ratio?: string;
  emptyLabel?: string;
}) {
  const style = ratio ? { aspectRatio: ratio } : undefined;
  if (!src) {
    return (
      <div className={['media media--empty contour', className].filter(Boolean).join(' ')} style={style}>
        <ImageIcon size={28} />
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className={['media', className].filter(Boolean).join(' ')} style={style}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized />
      {hoverSrc && <Image src={hoverSrc} alt="" fill sizes={sizes} className="media__alt" unoptimized />}
    </div>
  );
}
