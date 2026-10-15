import { Skeleton } from './Skeleton';

// Generic route loading state: an announced label plus placeholder blocks.
export function PageSkeleton({ label }: { label: string }) {
  return (
    <>
      <p className="sr-only" role="status">
        {label}
      </p>
      <Skeleton style={{ height: 36, width: '50%', marginBottom: 16 }} />
      <Skeleton style={{ height: 220, marginBottom: 16, borderRadius: 24 }} />
      <Skeleton style={{ height: 16, width: '80%', marginBottom: 8 }} />
      <Skeleton style={{ height: 16, width: '60%' }} />
    </>
  );
}
