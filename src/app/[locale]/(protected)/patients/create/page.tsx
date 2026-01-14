// app/[locale]/patients/create/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "@/app/lib/db/local-client";
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

  // Fetch doctors for the referring doctors section
  const doctors = await localPrisma.doctor.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      name: true,
      specialization: true,
    },
    orderBy: { name: 'asc' }
  });

  return (
    <CreatePatientClient
      locale={locale}
      initialDoctors={doctors}
      session={session}
    />
  );
}