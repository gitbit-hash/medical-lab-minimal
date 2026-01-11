// app/[locale]/patients/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../lib/db/local-client";
import { PatientsPageClient } from "./patients-page-client";
import { PatientWithRelations } from "../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;
const ITEMS_PER_PAGE = 25;

interface PatientsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PatientsPage({ params, searchParams }: PatientsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  if (!session || (session.user?.role !== "SuperAdmin" && !session.user?.can_view_all_patients)) {
    redirect(`/${locale}`);
  }

  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search as string || '';
  const doctorId = resolvedSearchParams.doctorId as string || 'all';
  const dateFilter = resolvedSearchParams.dateFilter as string || 'all';
  const sortBy = resolvedSearchParams.sort as string || 'newest';
  const limit = Number(resolvedSearchParams.limit) || ITEMS_PER_PAGE; // Add this line


  const whereClause: any = {
    is_deleted: false,
  };

  // Search filter
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Doctor filter
  if (doctorId && doctorId !== 'all') {
    whereClause.doctors = {
      some: {
        doctor_id: doctorId,
      },
    };
  }

  // Date filter
  if (dateFilter && dateFilter !== 'all') {
    const now = new Date();
    const startDate = new Date();

    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    whereClause.created_at = {
      gte: startDate,
    };
  }

  // Order by
  const orderByClause: any = {};
  switch (sortBy) {
    case 'newest':
      orderByClause.created_at = 'desc';
      break;
    case 'oldest':
      orderByClause.created_at = 'asc';
      break;
    case 'name-asc':
      orderByClause.name = 'asc';
      break;
    case 'name-desc':
      orderByClause.name = 'desc';
      break;
    default:
      orderByClause.created_at = 'desc';
  }

  const [patients, totalCount, uniqueDoctors] = await Promise.all([
    localPrisma.patient.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
      },
    }),
    localPrisma.patient.count({ where: whereClause }),
    localPrisma.doctor.findMany({
      where: { is_deleted: false },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <PatientsPageClient
      locale={locale}
      initialPatients={patients as PatientWithRelations[]}
      initialTotalPages={totalPages}
      initialTotalCount={totalCount}
      initialItemsPerPage={limit}
      initialDoctors={uniqueDoctors}
      session={session}
      initialSearchParams={{
        search,
        doctorId,
        dateFilter,
        sortBy,
        page,
      }}
    />
  );
}