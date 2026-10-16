import type { ReactNode } from 'react';
import { MountainIcon } from './icons';

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <span className="state__icon">
        <MountainIcon size={28} />
      </span>
      <p>{children}</p>
      {action}
    </div>
  );
}
