// app/components/logout-button.tsx
'use client';

import { signOut } from 'next-auth/react';
import { HiOutlineLogout } from "react-icons/hi";
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const params = useParams();
  const locale = params?.locale as string || 'en';

  const t = useTranslations('Navigation');

  const handleLogout = async () => {
    await signOut({
      callbackUrl: `/${locale}/login`,
      redirect: true
    });
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm h-auto min-h-[44px] whitespace-normal min-w-[100px] ${className}`}
    >
      <HiOutlineLogout className="text-sm flex-shrink-0" />
      <span>{t('logout')}</span>
    </button>
  );
}