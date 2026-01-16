// app/layout.tsx
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers/session-provider";
import { getServerSession } from "next-auth";
import { authOptions } from './api/auth/auth-options';
import { validateStartupSafe } from './lib/startup-validation';

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lap Manager Pro",
  description: "Offline-first laboratory management system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate startup requirements
  await validateStartupSafe();

  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Failed to get session:", error);
    // Ignore error and continue as unauthenticated
  }

  return (
    // Add the required html and body tags
    <html lang="en">
      <body >
        <AuthSessionProvider session={session}>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}