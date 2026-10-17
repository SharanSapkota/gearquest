import type { ReactNode } from 'react';
import { MountainIcon } from './icons';

// Friendly empty/error state: icon on a contour-line backdrop, optional heading, message and
// a clear next action.
export function EmptyState({
  children,
  title,
  action,
  icon,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="state contour">
      <span className="state__art">{icon ?? <MountainIcon size={34} />}</span>
      {title && <h2>{title}</h2>}
      <p>{children}</p>
      {action && <div className="state__actions">{action}</div>}
    </div>
  );
}
