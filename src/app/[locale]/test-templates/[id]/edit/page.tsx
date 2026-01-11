// app/[locale]/test-templates/[id]/edit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../../lib/db/local-client";
import { EditTestTemplateClient } from "./edit-template-client";
import { TestTemplateWithCategoryAndParams, TestCategoryBase } from "../../../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface EditTestTemplatePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditTestTemplatePage({ params }: EditTestTemplatePageProps) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  if (!session || (session.user?.role !== "SuperAdmin" && !session.user?.can_edit_test_templates)) {
    redirect(`/${locale}/test-templates`);
  }

  // Fetch template and categories in parallel
  const [template, categories] = await Promise.all([
    localPrisma.testTemplate.findUnique({
      where: { id },
      include: {
        category: true,
        parameters: {
          orderBy: { sort_order: 'asc' }
        }
      }
    }),
    localPrisma.testCategory.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!template) {
    notFound();
  }

  return (
    <EditTestTemplateClient
      locale={locale}
      initialTemplate={template as TestTemplateWithCategoryAndParams}
      initialCategories={categories as TestCategoryBase[]}
      session={session}
    />
  );
}