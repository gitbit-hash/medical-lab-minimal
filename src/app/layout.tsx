// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "./providers/session-provider";
import { validateStartupSafe } from './lib/startup-validation';

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Lap Manager Pro - Laboratory Management System",
    template: "%s | Lap Manager Pro"
  },
  description: "Professional laboratory management system for medical labs. Manage patients, tests, results, and reports efficiently.",
  keywords: ["laboratory management", "medical lab software", "LIMS", "lab results", "patient management", "medical testing", "lab reports"],
  authors: [{ name: "Lap Manager Pro" }],
  creator: "Lap Manager Pro",
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Lap Manager Pro",
    title: "Lap Manager Pro - Laboratory Management System",
    description: "Professional   laboratory management system for medical labs. Manage patients, tests, results, and reports efficiently.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lap Manager Pro - Laboratory Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lap Manager Pro - Laboratory Management System",
    description: "Professional   laboratory management system for medical labs",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
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
      <body className={inter.className}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}