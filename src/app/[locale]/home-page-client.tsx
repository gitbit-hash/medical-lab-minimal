// app/[locale] / home - page - client.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Session } from "next-auth";
import { TestStatus } from '@prisma/client';
import Image from 'next/image';

interface HomePageClientProps {
  locale: string;
  session: Session | null;
  data: {
    quickStats: Array<{
      labelKey: string;
      value: number;
      color: string;
      icon: string;
    }>;
    quickActions: Array<{
      titleKey: string;
      descriptionKey: string;
      href: string;
      color: string;
      icon: string;
      gradient: string;
    }>;
    recentTests: any[];
    systemStatusItems: Array<{
      labelKey: string;
      valueKey: string;
      count?: number;
      status: string;
      icon: string;
    }>;
    userRole?: string;
  };
}

export function HomePageClient({
  locale,
  session,
  data
}: HomePageClientProps) {
  useParams();
  const t = useTranslations('HomePage');
  const commonT = useTranslations('Common');

  const {
    quickStats,
    quickActions,
    recentTests,
    systemStatusItems,
    userRole
  } = data;

  return (
    <main className="min-h-screen">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden text-white py-16 lg:py-24 mb-16 rounded-b-3xl shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          {/* Branding Section */}
          <div className="mb-12">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-6">
              <Image
                src="/images/logo.png"
                alt="Lab Logo"
                width={400}
                height={400}
                priority
              />
            </div>

            {/* Tagline */}
            <div className="mb-8">
              <p className="text-xl lg:text-2xl font-light text-blue-500 mb-4">
                {t('hero.managementSystem')}
              </p>
              <div className="w-24 h-1 bg-linear-to-r from-cyan-400 to-blue-400 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="mb-4">
                <p className="text-2xl font-semibold text-blue-500 mb-2">
                  {session?.user?.name
                    ? commonT('welcomeWithName', { name: session.user.name })
                    : commonT('welcome')
                  }
                </p>
                <p className="text-blue-500 text-lg">
                  {t('hero.manageOperations')}
                </p>
              </div>

              {session?.user?.role && (
                <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-3 animate-pulse"></div>
                  <span className="text-blue-500 font-medium text-sm">
                    {session.user.role}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Enhanced */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`bg-linear-to-br ${stat.color} rounded-3xl p-6 text-white shadow-2xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden group`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold drop-shadow-lg">{stat.value}</p>
                  <p className="text-blue-100/90 text-sm font-medium mt-2 tracking-wide">
                    {t(stat.labelKey)}
                  </p>
                </div>
                <div className="text-4xl opacity-90 transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
              </div>

              {/* Animated underline */}
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-1 bg-white/30 transition-all duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions - Enhanced */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('quickActions.title')}</h2>
                  <p className="text-gray-600">{t('quickActions.subtitle')}</p>
                </div>
                <div className="w-14 h-14 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⚡</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action, index) => (
                  <EnhancedDashboardCard
                    key={index}
                    title={t(action.titleKey)}
                    description={t(action.descriptionKey)}
                    href={action.href}
                    color={action.color}
                    icon={action.icon}
                    gradient={action.gradient}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <RecentTests
              recentTests={recentTests}
              translations={{
                title: t('recentActivity.title'),
                viewAll: t('recentActivity.viewAll'),
                noTests: t('recentActivity.noTests'),
                testsWillAppear: t('recentActivity.testsWillAppear')
              }}
            />

            <SystemStatus
              systemStatusItems={systemStatusItems}
              userRole={userRole}
              translations={{
                title: t('systemStatus.title'),
                adminPanel: t('systemStatus.adminPanel'),
                dashboard: t('systemStatus.dashboard'),
                manageUsers: t('systemStatus.manageUsers')
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// Enhanced Dashboard Card Component
interface EnhancedDashboardCardProps {
  title: string;
  description: string;
  href: string;
  color: string;
  icon: string;
  gradient: string;
}

function EnhancedDashboardCard({ title, description, href, icon, gradient }: EnhancedDashboardCardProps) {
  return (
    <Link href={href} className="block group">
      <div className={`bg-linear-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 group-hover:scale-105 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-white drop-shadow-lg">{title}</h3>
              </div>
              <p className="text-white/90 text-sm leading-relaxed font-light">{description}</p>
            </div>
          </div>

          {/* Animated Arrow */}
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center transform group-hover:translate-x-1 transition-transform duration-300">
              <span className="text-white text-lg">→</span>
            </div>
            <div className="text-xs text-white/70 font-medium opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              Get Started
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>
    </Link>
  );
}

// Recent Tests Component
interface RecentTestsProps {
  recentTests: any[];
  translations: {
    title: string;
    viewAll: string;
    noTests: string;
    testsWillAppear: string;
  };
}

function RecentTests({ recentTests, translations }: RecentTestsProps) {
  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{translations.title}</h2>
        <Link
          href="/tests"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
        >
          <span>{translations.viewAll}</span>
          <span>→</span>
        </Link>
      </div>

      <div className="space-y-4">
        {recentTests.map((test) => (
          <div
            key={test.id}
            className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-sm">🧪</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{test.test_type}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <span className="truncate">{test.patient.name}</span>
                {test.doctor && (
                  <>
                    <span>•</span>
                    <span className="truncate">Dr. {test.doctor.name}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(test.created_at)}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                {test.status}
              </span>
              {test.test_template?.fees && test.test_template.fees > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  {test.test_template.fees.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        ))}

        {recentTests.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">{translations.noTests}</div>
            <p className="text-sm text-gray-600">
              {translations.testsWillAppear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// System Status Component
interface SystemStatusProps {
  // UPDATE THIS INTERFACE
  systemStatusItems: Array<{
    labelKey: string; // Changed from 'label'
    valueKey: string; // Changed from 'value'
    count?: number;   // Added this for pluralization
    status: string;
    icon: string;
  }>;
  userRole?: string;
  translations: {
    title: string;
    adminPanel: string;
    dashboard: string;
    manageUsers: string;
  };
}

function SystemStatus({
  systemStatusItems,
  userRole,
  translations
}: SystemStatusProps) {
  const t = useTranslations('HomePage');
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{translations.title}</h2>
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <span className="text-green-600 text-sm">🛠</span>
        </div>
      </div>

      <div className="space-y-4">
        {systemStatusItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              {/* Use the labelKey to get the translated label */}
              <span className="font-medium text-gray-700">{t(item.labelKey)}</span>
            </div>
            <span className={`font-semibold ${getStatusColor(item.status)}`}>
              {/* Use the valueKey and count to get the translated, pluralized value */}
              {item.count !== undefined
                ? t(item.valueKey, { count: item.count })
                : t(item.valueKey)
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}