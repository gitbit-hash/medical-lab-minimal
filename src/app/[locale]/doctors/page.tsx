// app/[locale]/doctors/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../lib/db/local-client";
import { DoctorsPageClient } from "./doctors-page-client";
import { DoctorForList } from "../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;
const ITEMS_PER_PAGE = 25;

interface DoctorsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DoctorsPage({ params, searchParams }: DoctorsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search as string || '';
  const specialization = resolvedSearchParams.specialization as string || 'all';
  const sortBy = resolvedSearchParams.sort as string || 'name-asc';
  const limit = ITEMS_PER_PAGE;

  const whereClause: any = {
    is_deleted: false,
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { specialization: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { clinic_address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (specialization && specialization !== 'all') {
    whereClause.specialization = specialization;
  }

  const orderByClause: any = {};
  switch (sortBy) {
    case 'name-asc':
      orderByClause.name = 'asc';
      break;
    case 'name-desc':
      orderByClause.name = 'desc';
      break;
    // NOTE: Sorting by patient count is complex and might require a raw query or multiple queries.
    // For simplicity, we are defaulting to name sort here. You can expand this later.
    default:
      orderByClause.name = 'asc';
  }

  const [doctors, totalCount] = await Promise.all([
    localPrisma.doctor.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        patients: {
          where: {
            patient: {
              is_deleted: false  // Filter out deleted patients
            }
          },
          select: {
            id: true,
            patient: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    localPrisma.doctor.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Get unique specializations for filter dropdown
  const specializationData = await localPrisma.doctor.groupBy({
    by: ['specialization'],
    where: { specialization: { not: null }, is_deleted: false },
  });

  // FIX: Explicitly cast the filtered array to string[]
  const uniqueSpecializations = specializationData
    .map(s => s.specialization)
    .filter((spec): spec is string => Boolean(spec)); // Use a type guard

  // Transform the data to match DoctorForList type
  const transformedDoctors = doctors.map(doctor => ({
    ...doctor,
    patients: doctor.patients.map(p => p.patient)
  })) as DoctorForList[];

  return (
    <DoctorsPageClient
      locale={locale}
      initialDoctors={transformedDoctors}
      initialTotalPages={totalPages}
      initialTotalCount={totalCount}
      initialItemsPerPage={limit}
      initialSpecializations={uniqueSpecializations}
      session={session}
    />
  );
}