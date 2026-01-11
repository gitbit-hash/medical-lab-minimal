// app/[locale]/patients/[id]/edit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { EditPatientClient } from "./edit-patient-client";
import { PatientWithRelations, TestWithRelations } from "../../../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface EditPatientPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { locale, id: patientId } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch patient, doctors, and tests in parallel
  const [patientData, doctorsData, testsData] = await Promise.all([
    localPrisma.patient.findUnique({
      where: {
        id: patientId,
        is_deleted: false
      },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
    }),
    localPrisma.doctor.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        name: true,
        specialization: true,
      },
      orderBy: { name: 'asc' }
    }),
    localPrisma.test.findMany({
      where: {
        patient_id: patientId,
        is_deleted: false
      },
      include: {
        patient: true,
        doctor: true,
        test_template: true,
      },
    }),
  ]);

  if (!patientData) {
    notFound();
  }

  return (
    <EditPatientClient
      locale={locale}
      initialPatient={patientData as PatientWithRelations}
      session={session}
    />
  );
}