// app/[locale]/admin/admin-page-client.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Session } from "next-auth";
import Link from "next/link";
import { useState } from 'react';
import {
  TestTube,
  BanknoteArrowUp,
  ArrowLeftRight,
  TrendingUp,
  ChartSpline,
  FolderSync,
  Database,
  Link as LucideLink
} from 'lucide-react';

// Move the StatCard and StatusCard components here
function StatCard({ title, value, subtitle, icon, trend, onClick }: {
  title: string;
  value: string;
  subtitle: string;
  icon: string | React.ReactNode;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
          {typeof icon === 'string' ? icon : icon}
        </div>
        {trend && trend !== 'neutral' && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
            {trend === 'up' ? '↗' : '↘'}
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}

function StatusCard({ title, status, description, icon }: {
  title: string;
  status: "operational" | "warning" | "error";
  description: string;
  icon: string | React.ReactNode;
}) {
  const t_status = useTranslations('AdminPage.statuses');

  const statusColors = {
    operational: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800"
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-700">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {t_status(status)}
      </span>
    </div>
  );
}

// Revenue Breakdown Card
function RevenueBreakdownCard({
  title,
  grossRevenue,
  labCosts,
  netRevenue,
  period = 'daily',
  testCount
}: {
  title: string;
  grossRevenue: number;
  labCosts: number;
  netRevenue: number;
  period?: 'daily' | 'monthly';
  testCount?: number;
}) {
  const t = useTranslations('AdminPage');
  const locale = useParams().locale as string;

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      style: 'currency',
      currency: locale === 'ar' ? 'EGP' : locale === 'en' ? 'USD' : 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    if (grossRevenue === 0) return formatNumber(0);
    const percentage = (value / grossRevenue) * 100;
    return `${formatNumber(percentage)}%`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${period === 'daily' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          }`}>
          {period === 'daily' ? <TrendingUp className="h-6 w-6" /> : <ChartSpline className="h-6 w-6" />}
        </div>
      </div>

      <div className="space-y-4">
        {/* Net Revenue (Highlighted) */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">{t('revenue.netRevenue')}</span>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(netRevenue)}</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <BanknoteArrowUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">{t('revenue.grossRevenue')}</p>
              <p className="text-sm text-gray-500">{formatCurrency(grossRevenue)}</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-green-600">{formatPercentage(grossRevenue)}</span>
        </div>

        {/* Lab Costs */}
        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <ArrowLeftRight className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">{t('revenue.labCosts')}</p>
              <p className="text-sm text-gray-500">
                {testCount ? `${formatNumber(testCount)} ${t('revenue.tests')}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-red-600">-{formatCurrency(labCosts)}</span>
            <p className="text-sm text-gray-500 mt-1">{formatPercentage(labCosts)}</p>
          </div>
        </div>

        {/* Net Profit Margin */}
        {grossRevenue > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{t('revenue.profitMargin')}</span>
              <span className={`text-sm font-semibold ${(netRevenue / grossRevenue) >= 0.7 ? 'text-green-600' :
                (netRevenue / grossRevenue) >= 0.4 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                {formatNumber((netRevenue / grossRevenue) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${(netRevenue / grossRevenue) >= 0.7 ? 'bg-green-500' :
                  (netRevenue / grossRevenue) >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                style={{ width: `${(netRevenue / grossRevenue) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Link Card Component
function AdminLinkCard({ title, description, href, icon, color }: {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="block group"
    >
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1 group-hover:scale-105 h-full`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl`}>
            {icon}
          </div>
          <div className="text-gray-400 group-hover:text-gray-600 transform group-hover:translate-x-1 transition-all duration-300">
            →
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

// Main Client Component
interface AdminPageClientProps {
  locale: string;
  session: Session | null;
  data: {
    // Revenue metrics
    dailyGrossRevenue: number;
    monthlyGrossRevenue: number;
    dailyExternalLabCost: number;
    monthlyExternalLabCost: number;
    dailyNetRevenue: number;
    monthlyNetRevenue: number;

    // Test metrics
    totalTests: number;
    dailyExternalLabTests: number;
    monthlyExternalLabTests: number;
    totalExternalLabTests: number;
    dailyExternalLabPercentage: number;
    monthlyExternalLabPercentage: number;

    // Other metrics
    userStats: { _count: { _all: number } };
    topTests: { test_type: string; _count: { _all: number } }[];
    recentLogins: {
      id: string;
      name: string;
      email: string;
      role: string;
      last_login_at: Date | null;
    }[];
    pendingSync: number;
  };
}

export function AdminPageClient({ locale, session, data }: AdminPageClientProps) {
  // This hook forces re-render when locale changes
  const params = useParams();
  const router = useRouter();

  // Get translations using the hook
  const t = useTranslations('AdminPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const [revenueView, setRevenueView] = useState<'gross' | 'net'>('net');

  const {
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
  } = data;

  // Format currency based on locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale, {
      style: 'currency',
      currency: locale === 'ar' ? 'EGP' : locale === 'en' ? 'USD' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${formatNumber(value)}%`;
  };

  // Admin quick links data
  const adminLinks = [
    {
      title: t('quickLinks.users.title'),
      description: t('quickLinks.users.description'),
      href: `/${locale}/admin/users`,
      icon: '👥',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: t('quickLinks.auditLogs.title'),
      description: t('quickLinks.auditLogs.description'),
      href: `/${locale}/admin/audit-logs`,
      icon: '📝',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: t('quickLinks.pdfSettings.title'),
      description: t('quickLinks.pdfSettings.description'),
      href: `/${locale}/admin/pdf-settings`,
      icon: '📄',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: t('quickLinks.receiptSettings.title'),
      description: t('quickLinks.receiptSettings.description'),
      href: `/${locale}/admin/receipt-settings`,
      icon: '🧾',
      color: 'bg-red-50 text-red-600'
    },
    {
      title: t('quickLinks.backup.title'),
      description: t('quickLinks.backup.description'),
      href: `/${locale}/admin/backup`,
      icon: '💾',
      color: 'bg-gray-50 text-gray-600'
    }
  ];

  // Calculate trends
  const getDailyTrend = () => {
    if (dailyGrossRevenue === 0) return 'neutral';
    return dailyNetRevenue >= (dailyGrossRevenue * 0.7) ? 'up' : 'down';
  };

  const getMonthlyTrend = () => {
    if (monthlyGrossRevenue === 0) return 'neutral';
    return monthlyNetRevenue >= (monthlyGrossRevenue * 0.7) ? 'up' : 'down';
  };

  return (
    <div className="space-y-8" dir={direction}>
      {/* Welcome Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{t('hero.title')}</h1>
        <p className="text-blue-100">{t('hero.subtitle')}</p>
      </div>

      {/* Revenue View Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('revenue.title')}</h2>
            <p className="text-gray-600 text-sm mt-1">{t('revenue.subtitle')}</p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setRevenueView('gross')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${revenueView === 'gross' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {t('revenue.grossView')}
            </button>
            <button
              onClick={() => setRevenueView('net')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${revenueView === 'net' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {t('revenue.netView')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('stats.dailyRevenue.title')}
          value={formatCurrency(revenueView === 'net' ? dailyNetRevenue : dailyGrossRevenue)}
          subtitle={revenueView === 'net'
            ? t('stats.dailyNetRevenue.subtitle', { gross: formatCurrency(dailyGrossRevenue), costs: formatCurrency(dailyExternalLabCost) })
            : t('stats.dailyRevenue.subtitle')
          }
          icon={<BanknoteArrowUp className="h-6 w-6 text-green-600" />}
          trend={getDailyTrend()}
          onClick={() => setRevenueView(revenueView === 'net' ? 'gross' : 'net')}
        />
        <StatCard
          title={t('stats.monthlyRevenue.title')}
          value={formatCurrency(revenueView === 'net' ? monthlyNetRevenue : monthlyGrossRevenue)}
          subtitle={revenueView === 'net'
            ? t('stats.monthlyNetRevenue.subtitle', { gross: formatCurrency(monthlyGrossRevenue), costs: formatCurrency(monthlyExternalLabCost) })
            : t('stats.monthlyRevenue.subtitle')
          }
          icon={<BanknoteArrowUp className="h-6 w-6 text-green-600" />}
          trend={getMonthlyTrend()}
          onClick={() => setRevenueView(revenueView === 'net' ? 'gross' : 'net')}
        />
        <StatCard
          title={t('stats.completedTests.title')}
          value={formatNumber(totalTests)}
          subtitle={t('stats.completedTests.subtitle')}
          icon={<TestTube className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title={t('stats.externalLabTests.title')}
          value={formatNumber(totalExternalLabTests)}
          subtitle={t('stats.externalLabTests.subtitle', {
            daily: dailyExternalLabTests,
            monthly: monthlyExternalLabTests,
            dailyPercentage: formatPercentage(dailyExternalLabPercentage),
            monthlyPercentage: formatPercentage(monthlyExternalLabPercentage)
          })}
          icon={<ArrowLeftRight className="h-6 w-6 text-red-600" />}
          trend={dailyExternalLabPercentage > 30 ? 'up' : 'neutral'}
        />
      </div>

      {/* Revenue Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RevenueBreakdownCard
          title={t('revenue.dailyBreakdown')}
          grossRevenue={dailyGrossRevenue}
          labCosts={dailyExternalLabCost}
          netRevenue={dailyNetRevenue}
          period="daily"
          testCount={dailyExternalLabTests}
        />
        <RevenueBreakdownCard
          title={t('revenue.monthlyBreakdown')}
          grossRevenue={monthlyGrossRevenue}
          labCosts={monthlyExternalLabCost}
          netRevenue={monthlyNetRevenue}
          period="monthly"
          testCount={monthlyExternalLabTests}
        />
      </div>

      {/* Quick Admin Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('quickLinks.title')}</h2>
            <p className="text-gray-600 mt-1">{t('quickLinks.subtitle')}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <span className="text-blue-600 text-xl">
              {<LucideLink className="h-8 w-8 text-blue-600" />}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminLinks.map((link, index) => (
            <AdminLinkCard
              key={index}
              title={link.title}
              description={link.description}
              href={link.href}
              icon={link.icon}
              color={link.color}
            />
          ))}
        </div>

        {/* Optional: Add more links button if you plan to expand */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {t('quickLinks.moreComingSoon')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Tests Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('sections.topTests.title')}
            </h2>
            <span className="text-sm text-gray-500">{t('sections.topTests.subtitle')}</span>
          </div>
          <div className="space-y-4">
            {topTests.map((test, index) => (
              <div key={test.test_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                    {formatNumber(index + 1)}
                  </div>
                  <span className="font-medium text-gray-700">{test.test_type}</span>
                </div>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 border">
                  {formatNumber(test._count._all)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logins */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {t('sections.recentLogins.title')}
            </h2>
            <Link
              href={`/${locale}/admin/users`}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('sections.recentLogins.viewAll')}
            </Link>
          </div>
          <div className="space-y-4">
            {recentLogins.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${user.role === 'SuperAdmin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                    }`}>
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {t('sections.systemStatus.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            title={t('sections.systemStatus.database.title')}
            status="operational"
            description={t('sections.systemStatus.database.description')}
            icon={<Database className="h-8 w-8 text-blue-600" />}
          />
          <StatusCard
            title={t('sections.systemStatus.syncStatus.title')}
            status={pendingSync > 0 ? "warning" : "operational"}
            description={pendingSync > 0 ? t('sections.systemStatus.syncStatus.pending', { count: pendingSync }) : t('sections.systemStatus.syncStatus.ok')}
            icon={<FolderSync className="h-8 w-8 text-orange-600" />}
          />
          <StatusCard
            title={t('sections.systemStatus.labToLab.title')}
            status={monthlyExternalLabCost > monthlyGrossRevenue * 0.3 ? "warning" : "operational"}
            description={t('sections.systemStatus.labToLab.description', {
              cost: formatCurrency(monthlyExternalLabCost),
              percentage: formatPercentage(monthlyExternalLabPercentage)
            })}
            icon={<ArrowLeftRight className="h-8 w-8 text-red-600" />}
          />
        </div>
      </div>
    </div>
  );
}