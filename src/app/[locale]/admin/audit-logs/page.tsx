// app/[locale]/admin/audit-logs/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import { AuditLogsPageClient } from "./audit-logs-page-client";
import { redirect } from "next/navigation";
import { notFound } from 'next/navigation';

// Define the locales your app supports
const locales = ['en', 'ar', 'fr', 'es'] as const;

interface AuditLogsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AuditLogsPage({ params }: AuditLogsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || session.user?.role !== "SuperAdmin") {
    redirect(`/${locale}`);
  }

  const limit = 20;
  const page = 1; // Always fetch the first page on the server

  // Fetch initial logs and total count from the database
  const [logs, totalCount] = await Promise.all([
    localPrisma.auditLog.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    }),
    localPrisma.auditLog.count()
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Serialize dates to strings to avoid Next.js serialization errors
  const serializedLogs = logs.map(log => ({
    ...log,
    created_at: log.created_at.toISOString(),
  }));

  return (
    <AuditLogsPageClient
      locale={locale}
      initialLogs={serializedLogs}
      initialTotalPages={totalPages}
      initialTotalCount={totalCount} // Add this line
      session={session}
    />
  );
}