import { Skeleton } from './Skeleton';

// Generic route loading state: an announced label plus placeholder blocks. Lives inside the
// page shell, so it uses the same gutters as the real page.
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="page">
      <p className="sr-only" role="status">
        {label}
      </p>
      <Skeleton style={{ height: 36, width: 'min(320px, 60%)', marginBottom: 20 }} />
      <Skeleton style={{ height: 220, marginBottom: 20, borderRadius: 24 }} />
      <Skeleton style={{ height: 16, width: '80%', marginBottom: 8 }} />
      <Skeleton style={{ height: 16, width: '60%' }} />
    </div>
  );
}
