// app/[locale]/patients/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { PatientDetailClient } from "./patient-detail-client";
import { PatientWithRelations } from "../../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface PatientDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { locale, id: patientId } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch patient with all relations
  const patient = await localPrisma.patient.findUnique({
    where: {
      id: patientId,
      is_deleted: false
    },
    include: {
      doctors: {
        include: {
          doctor: true,
        },
        orderBy: { referred_at: 'desc' }
      },
      tests: {
        where: { is_deleted: false },
        include: {
          doctor: true,
        },
        orderBy: { created_at: 'desc' }
      },
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <PatientDetailClient
      locale={locale}
      initialPatient={patient as PatientWithRelations}
      session={session}
    />
  );
}