// app/[locale]/admin/pdf-settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { PDFSettingsPageClient, ReportSettings } from "./pdf-settings-page-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

// Define the locales your app supports
const locales = ['en', 'ar', 'fr', 'es'] as const;

// Define a type for the data fetched from the database
interface DbSetting {
  key: string;
  value: any;
}

interface PDFSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PDFSettingsPage({ params }: PDFSettingsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || session.user?.role !== "SuperAdmin") {
    redirect(`/${locale}`);
  }

  // Complete default settings including e-sign
  const defaultSettings: ReportSettings = {
    'header.enabled': true,
    'header.labName': 'LAB MEDICAL DIAGNOSTIC LABORATORY',
    'header.specialization1': 'Medical Laboratory Specialist',
    'header.specialization2': 'Medical Laboratory Specialist',
    'header.specialization3': 'Medical Laboratory Specialist',
    'header.preservedSpace': '100px',
    'footer.enabled': true,
    'footer.directorName': 'Dr. Laboratory Director',
    'footer.directorTitle': 'Medical Laboratory Scientist',
    'footer.labHours': 'Mon–Fri: 7AM–6PM\nSat: 8AM–2PM',
    'footer.address': '123 Main Street, City, Country',
    'footer.mobileNumber': '(555) 123-EMER',
    'footer.landlineNumber': '(555) 123-4567',
    'footer.preservedSpace': '120px',
    // E-sign settings
    'esign.enabled': false,
    'esign.imageUrl': '/signatures/director-signature.png',
    'esign.width': '120px',
    'esign.height': '40px',
    // Logo settings
    'logo.enabled': false,
    'logo.pngUrl': '',
    'logo.webUrl': '',
    'logo.width': '50px',
    'logo.height': '50px',
    'logo.align': 'left',
    'whatsapp.countryCode': '',
  };

  // Fetch all report settings, not just header and footer
  const settingsFromDb = await localPrisma.reportSettings.findMany();

  // Build settings object with proper type safety
  const mergedSettings: ReportSettings = { ...defaultSettings };

  settingsFromDb.forEach((setting: DbSetting) => {
    const key = setting.key as keyof ReportSettings;
    if (key in defaultSettings) {
      // Convert string 'true'/'false' to boolean for checkbox
      if (key === 'esign.enabled' || key === 'header.enabled' || key === 'logo.enabled' || key === 'footer.enabled') {
        mergedSettings[key] = setting.value === 'true' || setting.value === true;
      } else {
        mergedSettings[key] = setting.value;
      }
    }
  });

  return (
    <PDFSettingsPageClient
      locale={locale}
      initialSettings={mergedSettings}
      session={session}
    />
  );
}