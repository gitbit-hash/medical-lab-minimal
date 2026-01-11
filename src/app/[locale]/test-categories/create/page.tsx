// app/[locale]/test-categories/create/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { CreateTestCategoryClient } from "./create-test-category-client";
import { TestCategoryBase } from "../../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface CreateTestCategoryPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateTestCategoryPage({ params }: CreateTestCategoryPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch categories for parent selection
  const categories = await localPrisma.testCategory.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      description: true,
      parent_id: true,
    },
    orderBy: { name: 'asc' }
  });

  return (
    <CreateTestCategoryClient
      locale={locale}
      initialCategories={categories as TestCategoryBase[]}
      session={session}
    />
  );
}