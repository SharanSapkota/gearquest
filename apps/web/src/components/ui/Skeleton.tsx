import type { CSSProperties } from 'react';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={['skeleton', className].filter(Boolean).join(' ')} style={style} aria-hidden="true" />;
}

// Same shape as GearCard, so the grid does not jump when data arrives.
export function GearCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton style={{ aspectRatio: '4 / 3', width: '100%' }} />
      <div className="skeleton-card__body">
        <Skeleton style={{ height: 18, width: '75%' }} />
        <Skeleton style={{ height: 14, width: '40%' }} />
        <Skeleton style={{ height: 16, width: '55%' }} />
      </div>
    </div>
  );
}

export function GearGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <GearCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
