// app/sync/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSyncStatus } from '../lib/hooks/use-sync-status';

export default function SyncPage() {
  const { syncStatus, manualSync, refreshStatus } = useSyncStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Load initial status
    refreshStatus();
  }, [refreshStatus]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const success = await manualSync();
      if (success) {
        setLastSync(new Date());
        await refreshStatus();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPending = syncStatus.pendingPatients + syncStatus.pendingDoctors + syncStatus.pendingTests;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sync Status</h1>
          <p className="text-gray-600 mt-2">Monitor and manage data synchronization</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Network Status */}
          <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${syncStatus.isOnline ? 'border-green-500' : 'border-red-500'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Network</h3>
                <p className={`text-sm ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
            </div>
          </div>

          {/* Pending Patients */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Patients</h3>
                <p className="text-sm text-gray-600">
                  {syncStatus.pendingPatients} pending
                </p>
              </div>
              <div className={`text-2xl font-bold ${syncStatus.pendingPatients > 0 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                {syncStatus.pendingPatients}
              </div>
            </div>
          </div>

          {/* Pending Doctors */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Doctors</h3>
                <p className="text-sm text-gray-600">
                  {syncStatus.pendingDoctors} pending
                </p>
              </div>
              <div className={`text-2xl font-bold ${syncStatus.pendingDoctors > 0 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                {syncStatus.pendingDoctors}
              </div>
            </div>
          </div>

          {/* Pending Tests */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tests</h3>
                <p className="text-sm text-gray-600">
                  {syncStatus.pendingTests} pending
                </p>
              </div>
              <div className={`text-2xl font-bold ${syncStatus.pendingTests > 0 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                {syncStatus.pendingTests}
              </div>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Controls</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                {totalPending > 0
                  ? `You have ${totalPending} item${totalPending !== 1 ? 's' : ''} waiting to sync`
                  : 'All data is synced'
                }
              </p>
              {lastSync && (
                <p className="text-sm text-gray-500 mt-1">
                  Last sync: {lastSync.toLocaleString()}
                </p>
              )}
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing || totalPending === 0 || !syncStatus.isOnline}
              className={`px-6 py-2 rounded-lg font-medium ${isSyncing || totalPending === 0 || !syncStatus.isOnline
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Sync Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How Sync Works</h2>
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Automatic Sync</h3>
                <p>Changes are automatically synced when you're online. The system checks every 30 seconds.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Offline Work</h3>
                <p>When offline, all changes are stored locally and will sync when connection is restored.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Conflict Resolution</h3>
                <p>If conflicts occur during sync, they're marked for manual review to ensure data integrity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}