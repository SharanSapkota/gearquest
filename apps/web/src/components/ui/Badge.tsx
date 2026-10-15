import type { ReactNode } from 'react';

// `tone` maps to .badge--<tone>; statuses (active, accepted, requested...) work as tones too.
export function Badge({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={tone ? `badge badge--${tone}` : 'badge'}>{children}</span>;
}
