// app/layout.tsx
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers/session-provider";
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

  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}