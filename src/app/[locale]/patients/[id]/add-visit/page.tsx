// app/[locale]/patients/[id]/add-visit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { AddVisitClient } from "./add-visit-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface PatientForVisit {
  id: string;
  name: string;
  gender: string | null;
  age_value: number | null;
  age_unit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  current_visit_number: number;
  doctors: {
    doctor_id: string; // Add this
    doctor: {
      id: string;
      name: string;
    };
  }[];
}

interface AddVisitPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AddVisitPage({ params }: AddVisitPageProps) {
  const { locale, id: patientId } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch patient with current financial status
  const patient = await localPrisma.patient.findUnique({
    where: {
      id: patientId,
      is_deleted: false
    },
    select: {
      id: true,
      name: true,
      gender: true,
      age_value: true,
      age_unit: true,
      phone: true,
      email: true,
      address: true,
      amount_due: true,
      amount_paid: true,
      payment_status: true,
      current_visit_number: true,
      doctors: {
        select: {
          doctor_id: true, // Add this
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  // Redirect if patient has outstanding balance
  if ((patient.amount_due || 0) > 0) {
    redirect(`/${locale}/patients/${patientId}/tests`);
  }

  // Fetch doctors
  const doctors = await localPrisma.doctor.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      name: true,
      specialization: true,
    },
    orderBy: { name: 'asc' }
  });

  // Check if patient has unpaid balance
  const hasUnpaidBalance = (patient.amount_due || 0) > 0;

  return (
    <AddVisitClient
      locale={locale}
      patient={patient as PatientForVisit} // Cast to our custom type
      initialDoctors={doctors}
      session={session}
      hasUnpaidBalance={hasUnpaidBalance}
      currentAmountDue={patient.amount_due || 0}
    />
  );
}