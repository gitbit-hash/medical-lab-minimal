// app/[locale]/admin/receipt-settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { ReceiptSettingsPageClient } from "./receipt-settings-page-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface ReceiptSettingsPageProps {
  params: Promise<{ locale: string }>;
}

// Helper function to safely transform database settings
function transformDBSettings(settingsFromDb: any[]) {
  const transformed: Record<string, any> = {};

  settingsFromDb.forEach(setting => {
    const key = setting.key.replace('receipt.', '');
    const value = setting.value;

    // Skip null/undefined values
    if (value === null || value === undefined) {
      return;
    }

    // Convert based on expected type
    if (key.includes('.enabled') || key.includes('.showOnPaidReceipts')) {
      transformed[key] = Boolean(value);
    } else if (key === 'qrCode.position') {
      const allowed = ['top', 'bottom', 'right', 'left'];
      transformed[key] = allowed.includes(String(value)) ? value : 'bottom';
    } else {
      transformed[key] = String(value);
    }
  });

  return transformed;
}

export default async function ReceiptSettingsPage({ params }: ReceiptSettingsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || session.user?.role !== "SuperAdmin") {
    redirect(`/${locale}`);
  }

  // Fetch receipt settings
  const settingsFromDb = await localPrisma.reportSettings.findMany({
    where: {
      key: {
        startsWith: 'receipt.'
      }
    },
  });

  // Transform settings with type safety
  const receiptSettings = transformDBSettings(settingsFromDb);

  // Default settings
  const defaultSettings = {
    'qrCode.enabled': false,
    'qrCode.instapayId': '',
    'qrCode.accountName': '',
    'qrCode.bankName': '',
    'qrCode.qrImageUrl': '',
    'qrCode.note': 'Scan to pay via Instapay',
    'qrCode.showOnPaidReceipts': true,
    'qrCode.position': 'right' as const,
    'lab.name': '',
    'lab.address': '',
    'lab.phone': '',
    'lab.email': '',
    'lab.logoUrl': '',
    'lab.displayMode': 'text' as const
  };

  // Merge settings (db settings override defaults)
  const initialSettings = { ...defaultSettings, ...receiptSettings };

  return (
    <ReceiptSettingsPageClient
      locale={locale}
      initialSettings={initialSettings}
      session={session}
    />
  );
}