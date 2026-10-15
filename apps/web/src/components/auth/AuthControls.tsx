'use client';

import { SignInButton } from './SignInButton';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';

export function AuthControls({ pendingCount }: { pendingCount: number }) {
  const user = useAuth();
  return user ? <UserMenu user={user} pendingCount={pendingCount} /> : <SignInButton />;
}
