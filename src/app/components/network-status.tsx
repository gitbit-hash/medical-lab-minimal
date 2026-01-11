// app/components/network-status.tsx
'use client';

import { JSX, useState, useEffect } from 'react';
import { useSyncStatus } from '../lib/hooks/use-sync-status';
import { useSession } from "next-auth/react";

export function NetworkStatus(): JSX.Element | null {
  const { syncStatus, manualSync } = useSyncStatus();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const { data: session, status } = useSession();

  // Reset dismissed state when status changes
  useEffect(() => {
    if (!syncStatus.isOnline || (syncStatus.pendingPatients + syncStatus.pendingDoctors + syncStatus.pendingTests) > 0) {
      setIsDismissed(false);
      setIsVisible(true);
    }
  }, [syncStatus.isOnline, syncStatus.pendingPatients, syncStatus.pendingDoctors, syncStatus.pendingTests]);

  if (status === 'loading') return null;
  if (!session) return null;

  const handleManualSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await manualSync();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDismiss = (): void => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const totalPending = syncStatus.pendingPatients + syncStatus.pendingDoctors + syncStatus.pendingTests;

  // Don't show when everything is synced and online, or when dismissed
  if ((syncStatus.isOnline && totalPending === 0) || isDismissed) {
    return null;
  }

  const getStatusConfig = () => {
    if (!syncStatus.isOnline) {
      return {
        gradient: 'from-red-500 to-red-600',
        icon: '🔴',
        text: 'Offline - Working locally',
        buttonClass: 'bg-white text-red-700 hover:bg-red-50'
      };
    }

    if (totalPending > 0) {
      return {
        gradient: 'from-orange-500 to-orange-600',
        icon: '🟡',
        text: `${totalPending} items pending sync`,
        buttonClass: 'bg-white text-orange-700 hover:bg-orange-50'
      };
    }

    return {
      gradient: 'from-green-500 to-green-600',
      icon: '🟢',
      text: 'All systems operational',
      buttonClass: 'bg-white text-green-700 hover:bg-green-50'
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      <div className={`bg-linear-to-r ${statusConfig.gradient} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex items-center justify-between">
            {/* Left side - Status info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-sm">{statusConfig.icon}</span>
                <span className="text-sm font-medium truncate">
                  {statusConfig.text}
                </span>
              </div>

              {/* Pending items breakdown - only show on larger screens */}
              {totalPending > 0 && (
                <div className="hidden md:flex items-center space-x-4 text-xs opacity-90">
                  {syncStatus.pendingPatients > 0 && (
                    <span className="flex items-center space-x-1">
                      <span>👥</span>
                      <span>{syncStatus.pendingPatients}</span>
                    </span>
                  )}
                  {syncStatus.pendingDoctors > 0 && (
                    <span className="flex items-center space-x-1">
                      <span>👨‍⚕️</span>
                      <span>{syncStatus.pendingDoctors}</span>
                    </span>
                  )}
                  {syncStatus.pendingTests > 0 && (
                    <span className="flex items-center space-x-1">
                      <span>🧪</span>
                      <span>{syncStatus.pendingTests}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Sync button - only show when online and pending items */}
              {syncStatus.isOnline && totalPending > 0 && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${statusConfig.buttonClass}`}
                >
                  {isSyncing ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Syncing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>🔄</span>
                      <span>Sync Now</span>
                    </span>
                  )}
                </button>
              )}

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors duration-200 flex items-center justify-center w-6 h-6"
                title="Dismiss"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
          </div>

          {/* Progress bar for syncing state */}
          {isSyncing && (
            <div className="w-full bg-white/20 h-1">
              <div className="bg-white h-1 animate-pulse w-1/2"></div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-only simplified view */}
      {totalPending > 0 && (
        <div className="md:hidden bg-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-2">
              <div className="flex items-center justify-center space-x-6 text-xs opacity-90">
                {syncStatus.pendingPatients > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>👥</span>
                    <span>{syncStatus.pendingPatients}</span>
                  </span>
                )}
                {syncStatus.pendingDoctors > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>👨‍⚕️</span>
                    <span>{syncStatus.pendingDoctors}</span>
                  </span>
                )}
                {syncStatus.pendingTests > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>🧪</span>
                    <span>{syncStatus.pendingTests}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}