'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Session } from "next-auth";
import Image from 'next/image';

interface HomePageClientProps {
  locale: string;
  session: Session | null;
  data: {
    quickActions: Array<{
      titleKey: string;
      descriptionKey: string;
      href: string;
      color: string;
      icon: string;
      gradient: string;
    }>;
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
    quickActions,
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
