// app/[locale]/test-categories/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../lib/db/local-client";
import { TestCategoriesClient } from "./test-categories-client";
import { TestCategoryWithChildren } from "../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface TestCategoriesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TestCategoriesPage({ params }: TestCategoriesPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch categories with hierarchy
  const categories = await localPrisma.testCategory.findMany({
    where: {
      parent_id: null, // Start with top-level categories
      is_active: true
    },
    include: {
      children: {
        include: {
          children: {
            include: {
              tests: {
                where: { is_active: true },
                select: { id: true }
              }
            }
          },
          tests: {
            where: { is_active: true },
            select: { id: true }
          }
        }
      },
      tests: {
        where: { is_active: true },
        select: { id: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <TestCategoriesClient
      locale={locale}
      initialCategories={categories as TestCategoryWithChildren[]}
      session={session}
    />
  );
}