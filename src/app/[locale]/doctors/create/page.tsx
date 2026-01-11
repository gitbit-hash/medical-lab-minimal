// app/[locale]/doctors/create/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { DoctorCreatePageClient, DoctorFormData } from "./doctor-create-page-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface CreateDoctorPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateDoctorPage({ params }: CreateDoctorPageProps) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Redirect if not authenticated or not an admin
  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // In a real app, you might fetch data here, like a list of specializations
  // For this example, we'll pass an empty object for initialData
  const initialData = {} as DoctorFormData;

  return (
    <DoctorCreatePageClient
      locale={locale}
      initialData={initialData}
    />
  );
}