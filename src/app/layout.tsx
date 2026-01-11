// app/layout.tsx
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers/session-provider";
import { getServerSession } from "next-auth";
import { authOptions } from './api/auth/auth-options';
import { validateStartupSafe } from './lib/startup-validation';
import { LicenseErrorPage } from './components/license-error-page';

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
  // Validate startup requirements (including license)
  const validation = await validateStartupSafe();

  // If license validation failed, show error page instead of the app
  if (!validation.valid) {
    console.error('❌ Startup validation failed:', validation.error);

    return (
      <html lang="en">
        <body>
          <LicenseErrorPage
            error={validation.error || 'License validation failed'}
            licenseStatus={validation.licenseStatus}
            message={validation.message}
          />
        </body>
      </html>
    );
  }

  const session = await getServerSession(authOptions);

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