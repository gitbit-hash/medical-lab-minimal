// lib/hooks/use-sync-status.ts
'use client';

import { useState, useEffect } from 'react';

export interface SyncStatus {
  pendingPatients: number;
  pendingDoctors: number;
  pendingTests: number;
  isOnline: boolean;
}

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingPatients: 0,
    pendingDoctors: 0,
    pendingTests: 0,
    isOnline: true,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setSyncStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    };

    // Set initial online status
    updateOnlineStatus();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Load initial sync status from API
    loadSyncStatus();

    // Set up interval to refresh sync status
    const interval = setInterval(loadSyncStatus, 10000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync', { cache: 'no-store' });

      if (!response.ok) {
        console.warn("Sync API returned:", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Unexpected response type:", contentType);
        return;
      }

      const status = await response.json();

      if (status.error) {
        console.warn("Sync status error:", status.error);
        return;
      }

      setSyncStatus(prev => ({
        ...prev,
        pendingPatients: status.pendingPatients,
        pendingDoctors: status.pendingDoctors,
        pendingTests: status.pendingTests,
      }));
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const manualSync = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadSyncStatus(); // Refresh status after sync
        return true;
      }
      return false;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  };

  return {
    syncStatus,
    manualSync,
    refreshStatus: loadSyncStatus,
  };
}