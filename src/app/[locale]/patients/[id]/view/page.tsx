import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { PatientViewClient } from "./patient-view-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';
import { PatientWithDetails } from "../../../../types";

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface PatientViewPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PatientViewPage({ params }: PatientViewPageProps) {
  const { locale, id } = await params;
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
      id,
      is_deleted: false
    },
    include: {
      doctors: {
        include: {
          doctor: true,
        },
        where: {
          is_deleted: false
        }
      },
      tests: {
        where: {
          is_deleted: false
        },
        include: {
          doctor: true,
          test_template: {
            include: {
              category: true,
              parameters: true,
            }
          },
          external_lab: true,
          created_by: {
            select: { name: true, email: true }
          },
          updated_by: {
            select: { name: true, email: true }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      },
      discount_audits: {
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      }
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <PatientViewClient
      locale={locale}
      patient={patient as PatientWithDetails}
      session={session}
    />
  );
}