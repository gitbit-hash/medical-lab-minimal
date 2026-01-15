
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';
import { HomePageClient } from './home-page-client';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Fetch data
  const [recentTests, todayStats, systemData] = await Promise.all([
    localPrisma.test.findMany({
      where: { is_deleted: false },
      include: {
        patient: { select: { name: true } },
        doctor: { select: { name: true } },
        test_template: { select: { fees: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
    Promise.all([
      localPrisma.test.count({
        where: {
          is_deleted: false,
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      localPrisma.patient.count({
        where: {
          is_deleted: false,
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      localPrisma.test.count({
        where: {
          is_deleted: false,
          sync_status: 'Pending'
        }
      })
    ]),
    Promise.all([
      localPrisma.$queryRaw`SELECT 1 as connected`.then(() => true).catch(() => false),
      localPrisma.user.count({
        where: {
          is_active: true,
          last_login_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])
  ]);

  const [todayTests, todayPatients, pendingSyncCount] = todayStats;
  const [dbStatus, activeUsers] = systemData;

  // FIX: Add locale prefix to all hrefs
  const quickActionsData = [
    {
      titleKey: 'quickActions.patients.title',
      descriptionKey: 'quickActions.patients.description',
      href: `/${locale}/patients`, // Add locale prefix
      color: "blue",
      icon: "👥",
      gradient: "from-blue-500 to-blue-600"
    }
  ];

  return (
    <HomePageClient
      locale={locale}
      session={session}
      data={{
        quickActions: quickActionsData,
      }}
    />
  );
}
