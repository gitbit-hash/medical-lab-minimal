// lib/sync/sync-engine.ts
import { localPrisma } from '../db/local-client';
import { remoteDB } from '../db/remote-client';
import { Prisma, Patient, Doctor, Test, SyncStatus } from '@prisma/client';
import { SyncResult } from '../../types/sync';
import { ErrorLogger } from '../error-logger';
import { retryWithBackoff } from '../db/retry-helper';

class SyncEngine {
  private isSyncing = false;

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedPatients: 0,
        syncedDoctors: 0,
        syncedTests: 0,
        conflicts: 0,
        errors: ['Sync already in progress'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: false,
      syncedPatients: 0,
      syncedDoctors: 0,
      syncedTests: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Check if remote database is accessible
      const isRemoteOnline = await remoteDB.isOnline();
      if (!isRemoteOnline) {
        const error = new Error('Remote database is not accessible');
        await ErrorLogger.logSyncError('Remote database connection failed', error, {
          syncType: 'full',
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      // Sync local changes to remote
      await this.syncLocalToRemote(result);

      // Sync remote changes to local
      await this.syncRemoteToLocal(result);

      result.success = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(errorMessage);
      
      // Log sync error
      await ErrorLogger.logSyncError('Sync operation failed', error, {
        syncedPatients: result.syncedPatients,
        syncedDoctors: result.syncedDoctors,
        syncedTests: result.syncedTests,
        conflicts: result.conflicts,
        errors: result.errors,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncLocalToRemote(result: SyncResult): Promise<void> {
    // Connect to remote database with retry logic
    const remote = await retryWithBackoff(
      async () => await remoteDB.connect(),
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    );

    // Sync pending patients
    const pendingPatients = await localPrisma.patient.findMany({
      where: {
        sync_status: 'Pending' as SyncStatus,
        is_deleted: false
      },
    });

    for (const patient of pendingPatients) {
      try {
        await this.syncPatientToRemote(patient, remote);
        result.syncedPatients++;
      } catch (error) {
        await this.handleSyncError('patient', patient.id, error);
        result.conflicts++;
      }
    }

    // Sync pending doctors
    const pendingDoctors = await localPrisma.doctor.findMany({
      where: {
        sync_status: 'Pending' as SyncStatus,
        is_deleted: false
      },
    });

    for (const doctor of pendingDoctors) {
      try {
        await this.syncDoctorToRemote(doctor, remote);
        result.syncedDoctors++;
      } catch (error) {
        await this.handleSyncError('doctor', doctor.id, error);
        result.conflicts++;
      }
    }

    // Sync pending tests
    const pendingTests = await localPrisma.test.findMany({
      where: {
        sync_status: 'Pending' as SyncStatus,
        is_deleted: false
      },
    });

    for (const test of pendingTests) {
      try {
        await this.syncTestToRemote(test, remote);
        result.syncedTests++;
      } catch (error) {
        await this.handleSyncError('test', test.id, error);
        result.conflicts++;
      }
    }
  }

  private async syncPatientToRemote(patient: Patient, remote: any): Promise<void> {
    if (patient.is_deleted) {
      // Handle patient deletion on remote
      try {
        await remote.patient.update({
          where: { id: patient.id },
          data: {
            is_deleted: true,
            // You might want to set other fields as needed
          },
        });

        await localPrisma.patient.update({
          where: { id: patient.id },
          data: {
            sync_status: 'Synced' as SyncStatus,
            last_synced_at: new Date(),
          },
        });
      } catch (error) {
        // If patient doesn't exist on remote, that's fine - just mark as synced
        if (error instanceof Error && error.message.includes('Record to update not found')) {
          await localPrisma.patient.update({
            where: { id: patient.id },
            data: {
              sync_status: 'Synced' as SyncStatus,
              last_synced_at: new Date(),
            },
          });
        } else {
          throw error;
        }
      }
    } else if (patient.local_id) {
      // New patient - create on remote
      const remotePatient = await remote.patient.create({
        data: {
          name: patient.name,
          age_value: patient.age_value,
          age_unit: patient.age_unit,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
        },
      });

      // Update local record with remote ID
      await localPrisma.patient.update({
        where: { id: patient.id },
        data: {
          id: remotePatient.id,
          local_id: null,
          sync_status: 'Synced' as SyncStatus,
          last_synced_at: new Date(),
        },
      });
    } else {
      // Existing patient - update on remote
      await remote.patient.update({
        where: { id: patient.id },
        data: {
          name: patient.name,
          age_value: patient.age_value,
          age_unit: patient.age_unit,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
        },
      });

      await localPrisma.patient.update({
        where: { id: patient.id },
        data: {
          sync_status: 'Synced' as SyncStatus,
          last_synced_at: new Date(),
        },
      });
    }
  }

  private async syncDoctorToRemote(doctor: Doctor, remote: any): Promise<void> {
    if (doctor.local_id) {
      // New doctor - create on remote
      const remoteDoctor = await remote.doctor.create({
        data: {
          name: doctor.name,
          specialization: doctor.specialization,
          phone: doctor.phone,
          email: doctor.email,
          clinic_address: doctor.clinic_address,
        },
      });

      await localPrisma.doctor.update({
        where: { id: doctor.id },
        data: {
          id: remoteDoctor.id,
          local_id: null,
          sync_status: 'Synced' as SyncStatus,
          last_synced_at: new Date(),
        },
      });
    } else {
      // Existing doctor - update on remote
      await remote.doctor.update({
        where: { id: doctor.id },
        data: {
          name: doctor.name,
          specialization: doctor.specialization,
          phone: doctor.phone,
          email: doctor.email,
          clinic_address: doctor.clinic_address,
        },
      });

      await localPrisma.doctor.update({
        where: { id: doctor.id },
        data: {
          sync_status: 'Synced' as SyncStatus,
          last_synced_at: new Date(),
        },
      });
    }
  }

  private async syncTestToRemote(test: Test, remote: any): Promise<void> {
    // Build test data with proper JSON handling
    const testData: Prisma.TestCreateInput = {
      patient: { connect: { id: test.patient_id } },
      test_type: test.test_type,
      test_code: test.test_code,
      status: test.status,
      units: test.units,
      tested_at: test.tested_at,
      completed_at: test.completed_at,
    };

    // Handle referring doctor if present
    if (test.referring_doctor_id) {
      testData.doctor = { connect: { id: test.referring_doctor_id } };
    }

    // Handle JSON fields with proper Prisma types
    if (test.results === null || test.results === undefined) {
      testData.results = Prisma.DbNull;
    } else {
      testData.results = test.results as Prisma.InputJsonValue;
    }

    if (test.normal_range === null || test.normal_range === undefined) {
      testData.normal_range = Prisma.DbNull;
    } else {
      testData.normal_range = test.normal_range as Prisma.InputJsonValue;
    }

    if (test.local_id) {
      // New test - create on remote
      const remoteTest = await remote.test.create({
        data: testData,
      });

      await localPrisma.test.update({
        where: { id: test.id },
        data: {
          id: remoteTest.id,
          local_id: null,
          sync_status: 'Synced' as SyncStatus,
          last_synced_at: new Date(),
        },
      });
    } else {
      // Existing test - update on remote
      await remote.test.update({
        where: { id: test.id },
        data: testData,
      });

      await localPrisma.test.update({
        where: { id: test.id },
        data: {
          sync_status: 'Synced' as SyncStatus,
          last_synced_at: new Date(),
        },
      });
    }
  }

  private async syncRemoteToLocal(result: SyncResult): Promise<void> {
    // This will be implemented in future when we have multiple clients
    // For now, we're only syncing from local to remote
    console.log('Remote to local sync - to be implemented');
  }

  private async handleSyncError(entityType: 'patient' | 'doctor' | 'test', entityId: string, error: unknown): Promise<void> {
    console.error(`Sync error for ${entityType}:`, error);

    // Log the sync error
    await ErrorLogger.logSyncError(
      `Failed to sync ${entityType}`,
      error,
      {
        entityType,
        entityId,
        timestamp: new Date().toISOString(),
      }
    );

    // Use switch statement instead of dynamic property access
    switch (entityType) {
      case 'patient':
        await localPrisma.patient.update({
          where: { id: entityId },
          data: {
            sync_status: 'Conflict' as SyncStatus,
          },
        });
        break;
      case 'doctor':
        await localPrisma.doctor.update({
          where: { id: entityId },
          data: {
            sync_status: 'Conflict' as SyncStatus,
          },
        });
        break;
      case 'test':
        await localPrisma.test.update({
          where: { id: entityId },
          data: {
            sync_status: 'Conflict' as SyncStatus,
          },
        });
        break;
    }
  }
}

export const syncEngine = new SyncEngine();