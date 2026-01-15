// app/[locale]/patients/create/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { CreatePatientClient } from "./create-patient-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface CreatePatientPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreatePatientPage({ params }: CreatePatientPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  return (
    <CreatePatientClient
      locale={locale}
    />
  );
}