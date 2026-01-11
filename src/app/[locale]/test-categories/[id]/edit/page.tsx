// app/[locale]/test-categories/[id]/edit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { EditTestCategoryClient } from "./edit-test-category-client";
import { TestCategoryWithChildren } from "../../../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface EditTestCategoryPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditTestCategoryPage({ params }: EditTestCategoryPageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  // Fetch category and categories in parallel
  const [category, categories] = await Promise.all([
    localPrisma.testCategory.findUnique({
      where: { id },
      include: {
        children: {
          where: { is_active: true },
          include: {
            tests: {
              where: { is_active: true }
            }
          }
        },
        tests: {
          where: { is_active: true }
        }
      }
    }),
    localPrisma.testCategory.findMany({
      where: {
        is_active: true,
        // Exclude current category and its children to prevent circular references
        id: { not: id },
        parent_id: { not: id }
      },
      include: {
        children: {
          where: { is_active: true }
        }
      }
    })
  ]);

  if (!category) {
    notFound();
  }

  return (
    <EditTestCategoryClient
      locale={locale}
      initialCategory={category as TestCategoryWithChildren}
      initialCategories={categories as TestCategoryWithChildren[]}
      session={session}
    />
  );
}