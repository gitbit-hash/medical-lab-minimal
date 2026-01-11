// app/[locale]/doctors/[id]/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { DoctorDetailClient } from "./doctor-detail-page-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface DoctorDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const { id, locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  const doctor = await localPrisma.doctor.findUnique({
    where: { id },
    include: {
      patients: {
        where: {
          patient: {
            is_deleted: false  // Filter out deleted patients
          }
        },
        include: {
          patient: {
            include: {
              tests: {
                where: { is_deleted: false },
                orderBy: { created_at: 'desc' }
              }
            }
          }
        }
      }
    }
  });

  if (!doctor || doctor.is_deleted) {
    notFound();
  }

  return (
    <DoctorDetailClient
      locale={locale}
      doctor={doctor}
    />
  );
}