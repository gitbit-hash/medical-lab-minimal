// app/[locale]/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '../../lib/db/local-client';
import { AdminPageClient } from './admin-page-client';
import { notFound } from 'next/navigation';

// Define the locales your app supports
const locales = ['en', 'ar', 'fr', 'es'] as const;

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get today and current month dates
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // 📊 Fetch all data in parallel
  const [
    dailyTests,
    monthlyTests,
    totalTests,
    recentLogins,
    topTests,
    userStats,
    pendingSync,
    dailyRevenueResult,
    monthlyRevenueResult,
    dailyExternalLabCosts,
    monthlyExternalLabCosts
  ] = await Promise.all([
    // Daily tests
    localPrisma.test.findMany({
      where: {
        completed_at: {
          gte: startOfToday,
        },
        status: "Completed",
        is_deleted: false,
      },
      include: {
        test_template: { select: { fees: true } },
        patient: {
          select: {
            discount_amount: true,
            discount_percentage: true,
            discount_type: true,
            amount_paid: true,
            amount_due: true,
            total_amount: true,
            payment_status: true
          }
        },
        patient_visit: {
          select: {
            id: true,
            amount_paid: true,
            amount_due: true,
            total_amount: true,
            discount_amount: true,
            payment_status: true,
            visit_number: true
          }
        }
      },
    }),
    // Monthly tests
    localPrisma.test.findMany({
      where: {
        completed_at: {
          gte: startOfMonth,
        },
        status: "Completed",
        is_deleted: false,
      },
      include: {
        test_template: { select: { fees: true } },
        patient: {
          select: {
            discount_amount: true,
            discount_percentage: true,
            discount_type: true,
            amount_paid: true,
            amount_due: true,
            total_amount: true,
            payment_status: true
          }
        },
        patient_visit: {
          select: {
            id: true,
            amount_paid: true,
            amount_due: true,
            total_amount: true,
            discount_amount: true,
            payment_status: true,
            visit_number: true
          }
        }
      },
    }),
    // Total tests count
    localPrisma.test.count({
      where: { status: "Completed", is_deleted: false },
    }),
    // Recent logins
    localPrisma.user.findMany({
      where: { role: { in: ["Admin", "SuperAdmin"] } },
      orderBy: { last_login_at: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        last_login_at: true,
      },
    }),
    // Top tests
    localPrisma.test.groupBy({
      by: ["test_type"],
      where: {
        status: "Completed",
        is_deleted: false,
      },
      _count: { _all: true },
    })
      .then((data) =>
        data
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 5)
      ),
    // User stats
    localPrisma.user.aggregate({
      _count: {
        _all: true,
      },
      where: {
        role: "Admin"
      }
    }),
    // Pending sync
    localPrisma.test.count({
      where: {
        sync_status: "Pending",
        is_deleted: false
      }
    }),
    // DAILY REVENUE - from visits
    localPrisma.patientVisit.aggregate({
      where: {
        created_at: {
          gte: startOfToday,
        },
      },
      _sum: {
        amount_paid: true,
      },
    }),
    // MONTHLY REVENUE - from visits
    localPrisma.patientVisit.aggregate({
      where: {
        created_at: {
          gte: startOfMonth,
        },
      },
      _sum: {
        amount_paid: true,
      },
    }),
    // DAILY EXTERNAL LAB COSTS - NEW
    localPrisma.test.aggregate({
      where: {
        completed_at: {
          gte: startOfToday,
        },
        status: "Completed",
        external_lab_id: { not: null }, // Only tests assigned to external labs
        outsourcing_cost: { gt: 0 }, // Only tests with outsourcing costs
      },
      _sum: {
        outsourcing_cost: true,
      },
    }),
    // MONTHLY EXTERNAL LAB COSTS - NEW
    localPrisma.test.aggregate({
      where: {
        completed_at: {
          gte: startOfMonth,
        },
        status: "Completed",
        external_lab_id: { not: null },
        outsourcing_cost: { gt: 0 },
      },
      _sum: {
        outsourcing_cost: true,
      },
    })
  ]);

  // 💰 Compute gross revenue (total amount paid by patients)
  const dailyGrossRevenue = dailyRevenueResult._sum.amount_paid || 0;
  const monthlyGrossRevenue = monthlyRevenueResult._sum.amount_paid || 0;

  // 💰 Compute external lab costs (amount paid to external labs)
  const dailyExternalLabCost = dailyExternalLabCosts._sum.outsourcing_cost || 0;
  const monthlyExternalLabCost = monthlyExternalLabCosts._sum.outsourcing_cost || 0;

  // 💰 Compute net revenue (gross revenue minus external lab costs)
  const dailyNetRevenue = dailyGrossRevenue - dailyExternalLabCost;
  const monthlyNetRevenue = monthlyGrossRevenue - monthlyExternalLabCost;

  // 📈 Additional metrics for dashboard
  const dailyExternalLabTests = dailyTests.filter(test => test.external_lab_id).length;
  const monthlyExternalLabTests = monthlyTests.filter(test => test.external_lab_id).length;

  const totalExternalLabTests = await localPrisma.test.count({
    where: {
      status: "Completed",
      external_lab_id: { not: null },
      is_deleted: false
    }
  });

  // 📊 Calculate percentage of tests sent to external labs
  const dailyExternalLabPercentage = dailyTests.length > 0
    ? (dailyExternalLabTests / dailyTests.length) * 100
    : 0;

  const monthlyExternalLabPercentage = monthlyTests.length > 0
    ? (monthlyExternalLabTests / monthlyTests.length) * 100
    : 0;

  return (
    <AdminPageClient
      locale={locale}
      session={session}
      data={{
        // Revenue metrics
        dailyGrossRevenue,
        monthlyGrossRevenue,
        dailyExternalLabCost,
        monthlyExternalLabCost,
        dailyNetRevenue,
        monthlyNetRevenue,

        // Test metrics
        totalTests,
        dailyExternalLabTests,
        monthlyExternalLabTests,
        totalExternalLabTests,
        dailyExternalLabPercentage,
        monthlyExternalLabPercentage,

        // Other metrics
        userStats,
        topTests,
        recentLogins,
        pendingSync,
      }}
    />
  );
}