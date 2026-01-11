// app/[locale]/test-templates/create/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { CreateTestTemplateClient } from "./create-template-client";
import { TestCategoryBase } from "../../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface CreateTestTemplatePageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateTestTemplatePage({ params }: CreateTestTemplatePageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  if (!session || (session.user?.role !== "SuperAdmin" && !session.user?.can_create_test_templates)) {
    redirect(`/${locale}/test-templates`);
  }


  const categories = await localPrisma.testCategory.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' }
  });

  return (
    <CreateTestTemplateClient
      locale={locale}
      initialCategories={categories as TestCategoryBase[]}
      session={session}
    />
  );
}