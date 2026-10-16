import Image from 'next/image';

// Aspect-ratio box + next/image (lazy by default): no layout shift. Gear photos are arbitrary
// user-provided URLs, so they cannot go through the optimiser (no remote host allow-list).
export function GearImage({
  src,
  alt,
  sizes,
  className,
  priority,
  ratio,
  emptyLabel,
}: {
  src?: string;
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
      <div className={['media media--empty', className].filter(Boolean).join(' ')} style={style}>
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className={['media', className].filter(Boolean).join(' ')} style={style}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized />
    </div>
  );
}
