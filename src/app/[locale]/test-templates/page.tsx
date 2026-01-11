// app/[locale]/test-templates/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../lib/db/local-client";
import { TestTemplatesClient } from "./test-templates-client";
import { TestTemplateWithCategoryAndParams, TestTemplateForList } from "../../types";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface TestTemplatesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TestTemplatesPage({ params }: TestTemplatesPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
    redirect(`/${locale}`);
  }

  if (!session || (session.user?.role !== "SuperAdmin" && !session.user?.can_view_test_templates)) {
    redirect(`/${locale}`);
  }

  const templates = await localPrisma.testTemplate.findMany({
    where: { is_active: true },
    include: {
      category: true,
      _count: {
        select: { parameters: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <TestTemplatesClient
      locale={locale}
      initialTemplates={templates as unknown as TestTemplateForList[]}
      session={session}
    />
  );
}