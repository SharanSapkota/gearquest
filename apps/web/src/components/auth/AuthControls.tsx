'use client';

import { SignInButton } from './SignInButton';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';

export function AuthControls() {
  const user = useAuth();
  return user ? <UserMenu user={user} /> : <SignInButton />;
}
