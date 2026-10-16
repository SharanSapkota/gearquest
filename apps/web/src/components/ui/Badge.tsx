import type { ReactNode } from 'react';

// `tone` maps to .badge--<tone>; rental statuses (requested = amber, accepted = green,
// declined/cancelled = red-grey, completed = deep green, expired = grey) work as tones too.
export function Badge({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={tone ? `badge badge--${tone}` : 'badge'}>{children}</span>;
}
