// lib/sync/sync-service.ts
import { syncEngine } from './sync-engine';
import { localPrisma } from '../db/local-client';
import { SyncStatus } from '@prisma/client';

export class SyncService {
  /**
   * Triggers a sync operation directly (server-side)
   * Uses direct function call instead of HTTP request for better performance and reliability
   */
  static async triggerSync(): Promise<boolean> {
    try {
      const result = await syncEngine.sync();
      
      if (result.success) {
        console.log('✅ Sync completed successfully:', {
          patients: result.syncedPatients,
          doctors: result.syncedDoctors,
          tests: result.syncedTests,
          conflicts: result.conflicts,
        });
      } else {
        console.warn('⚠️ Sync completed with errors:', result.errors);
      }
      
      return result.success;
    } catch (error) {
      console.error('❌ Sync trigger failed:', error);
      return false;
    }
  }

  /**
   * Gets sync status directly from database (server-side)
   * Uses direct database query instead of HTTP request
   */
  static async getSyncStatus() {
    try {
      const [pendingPatients, pendingDoctors, pendingTests, totalPendingTests] =
        await localPrisma.$transaction([
          localPrisma.patient.count({
            where: { sync_status: 'Pending' as SyncStatus, is_deleted: false },
          }),
          localPrisma.doctor.count({
            where: { sync_status: 'Pending' as SyncStatus, is_deleted: false },
          }),
          localPrisma.test.count({
            where: { sync_status: 'Pending' as SyncStatus, is_deleted: false },
          }),
          localPrisma.test.count({
            where: { is_deleted: false },
          }),
        ]);

      return {
        pendingPatients,
        pendingDoctors,
        pendingTests,
        totalActiveTests: totalPendingTests,
      };
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return null;
    }
  }

  /**
   * Client-side sync trigger (for browser environments)
   * Falls back to HTTP request when direct call is not available
   */
  static async triggerSyncClient(): Promise<boolean> {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: use direct call
      return this.triggerSync();
    }

    // Client-side: use HTTP request
    try {
      // Use window.location.origin as it's always available in browser
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const response = await fetch(`${baseUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync triggered successfully:', result);
        return result.success || false;
      }
      return false;
    } catch (error) {
      console.error('❌ Sync trigger failed:', error);
      return false;
    }
  }

  /**
   * Client-side sync status (for browser environments)
   * Falls back to HTTP request when direct call is not available
   */
  static async getSyncStatusClient() {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: use direct call
      return this.getSyncStatus();
    }

    // Client-side: use HTTP request
    try {
      // Use window.location.origin as it's always available in browser
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const response = await fetch(`${baseUrl}/api/sync`);

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return null;
    }
  }
}