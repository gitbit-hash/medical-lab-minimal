// app/providers/session-provider.tsx
'use client';

import { SessionProvider } from "next-auth/react";

interface AuthSessionProviderProps {
  children: React.ReactNode;
  session?: any;
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}