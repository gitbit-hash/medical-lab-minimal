// app/[locale]/patients/[id]/tests/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { PatientTestsClient } from "./patient-tests-client";
import { TestWithRelations, PatientWithRelations } from "../../../../types";
import { redirect, notFound } from "next/navigation";

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface PatientTestsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PatientTestsPage({ params }: PatientTestsPageProps) {
  const { locale, id: patientId } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch patient
  const patientData = await localPrisma.patient.findUnique({
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
  });

  if (!patientData) {
    notFound();
  }

  // Fetch only tests that are:
  // 1. Not deleted
  // 2. Not both completed AND printed
  const testsData = await localPrisma.test.findMany({
    where: {
      patient_id: patientId,
      is_deleted: false,
      OR: [
        // Show all tests that are not completed
        { status: { not: 'Completed' } },
        // OR tests that are completed but not printed (not archived)
        {
          AND: [
            { status: 'Completed' },
            { is_printed: false } // This filters out archived tests
          ]
        }
      ]
    },
    include: {
      patient: true,
      doctor: true,
      test_template: {
        include: {
          category: true,
          parameters: true,
        },
      },
      external_lab: true,
      casa_analysis: true,
    },
    orderBy: { created_at: 'desc' },
  });

  // Also fetch archived tests (completed and printed) count
  const archivedTestsCount = await localPrisma.test.count({
    where: {
      patient_id: patientId,
      is_deleted: false,
      status: 'Completed',
      is_printed: true
    }
  });

  return (
    <PatientTestsClient
      locale={locale}
      initialPatient={patientData as PatientWithRelations}
      initialTests={testsData as TestWithRelations[]}
      initialArchivedTestsCount={archivedTestsCount}
      session={session}
    />
  );
}