'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Me } from '@/lib/api';

const AuthContext = createContext<Me | null>(null);

// The user is resolved on the server (layout) and handed to client components here.
export function AuthProvider({ user, children }: { user: Me | null; children: ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
