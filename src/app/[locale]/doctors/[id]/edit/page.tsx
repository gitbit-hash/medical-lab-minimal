// app/doctors/[id]/edit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { DoctorEditPageClient } from "./doctor-edit-page-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';
import { DoctorFormData } from "../../create/doctor-create-page-client";

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface EditDoctorPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditDoctorPage({ params }: EditDoctorPageProps) {
  const { id, locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Redirect if not authenticated
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Fetch the doctor's current data to pre-fill the form
  const doctor = await localPrisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor || doctor.is_deleted) {
    notFound();
  }
  // Populate initialData with the doctor's actual data
  const initialData: DoctorFormData = {
    name: doctor.name || '',
    specialization: doctor.specialization || '',
    phone: doctor.phone || '',
    email: doctor.email || '',
    clinic_address: doctor.clinic_address || '',
  };

  return (
    <DoctorEditPageClient
      locale={locale}
      initialData={initialData}
    />
  );
}