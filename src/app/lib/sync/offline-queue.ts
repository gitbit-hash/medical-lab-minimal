// lib/sync/offline-queue.ts
import { SyncStatus, Prisma } from '@prisma/client';
import { PatientQueueData, DoctorQueueData, TestQueueData } from '../../types/sync';
import { SyncService } from './sync-service';

import { getOptionalEnvVarNumber } from '../env-validation';

class OfflineQueue {
  private isOnline = true;
  private syncInterval: NodeJS.Timeout | null = null;
  // Configurable sync interval (default: 30 seconds)
  private readonly SYNC_INTERVAL_MS: number;

  constructor() {
    // Get sync interval from environment variable (default: 30000ms = 30 seconds)
    // Minimum: 5 seconds, Maximum: 5 minutes
    const envInterval = getOptionalEnvVarNumber('SYNC_INTERVAL', 30000);
    this.SYNC_INTERVAL_MS = Math.max(5000, Math.min(300000, envInterval));

    if (process.env.SYNC_INTERVAL) {
      console.log(`📡 Sync interval configured: ${this.SYNC_INTERVAL_MS}ms (${this.SYNC_INTERVAL_MS / 1000}s)`);
    }
  }

  // Initialize the queue manager
  init(): void {
    this.setupNetworkDetection();
    this.startAutoSync();
  }

  // Set up network status detection
  private setupNetworkDetection(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.trySync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    }
  }

  // Start automatic sync attempts
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.trySync();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  // Add patient to queue
  async addPatient(patientData: PatientQueueData): Promise<any> {
    const patientId = patientData.id || this.generateId();

    try {
      // Always store locally first
      const result = await this.storePatientLocally({
        ...patientData,
        id: patientId,
        local_id: patientData.id ? null : patientId,
        sync_status: 'Pending' as SyncStatus,
        is_deleted: patientData.is_deleted || false,
      });



      // If online, try immediate sync
      if (this.isOnline) {
        await this.trySync();
      }

      return result;
    } catch (error) {
      console.error('Failed to add patient to queue:', error);
      throw error;
    }
  }

  // Delete doctor (soft delete)
  async deleteDoctor(doctorId: string): Promise<any> {
    try {
      const { localPrisma } = await import('../db/local-client');

      // First, get the current doctor data for audit logging
      const existingDoctor = await localPrisma.doctor.findUnique({
        where: { id: doctorId },
      });

      if (!existingDoctor) {
        throw new Error('Doctor not found');
      }

      if (existingDoctor.is_deleted) {
        throw new Error('Doctor already deleted');
      }

      // Soft delete the doctor
      const deletedDoctor = await localPrisma.doctor.update({
        where: { id: doctorId },
        data: {
          is_deleted: true,
          sync_status: 'Pending' as SyncStatus,
          updated_at: new Date(),
        },
      });



      // If online, try immediate sync
      if (this.isOnline) {
        await this.trySync();
      }

      return deletedDoctor;
    } catch (error) {
      console.error('Failed to delete doctor in queue:', error);
      throw error;
    }
  }

  // You might also want to add a deletePatient method for consistency:
  async deletePatient(patientId: string): Promise<any> {
    try {
      const { localPrisma } = await import('../db/local-client');

      // Get current patient data for audit logging
      const existingPatient = await localPrisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!existingPatient) {
        throw new Error('Patient not found');
      }

      if (existingPatient.is_deleted) {
        throw new Error('Patient already deleted');
      }

      // Soft delete the patient
      const deletedPatient = await localPrisma.patient.update({
        where: { id: patientId },
        data: {
          is_deleted: true,
          sync_status: 'Pending' as SyncStatus,
          updated_at: new Date(),
        },
      });



      // If online, try immediate sync
      if (this.isOnline) {
        await this.trySync();
      }

      return deletedPatient;
    } catch (error) {
      console.error('Failed to delete patient in queue:', error);
      throw error;
    }
  }

  // Add doctor to queue
  async addDoctor(doctorData: DoctorQueueData): Promise<any> {
    const doctorId = doctorData.id || this.generateId();

    try {
      const result = await this.storeDoctorLocally({
        ...doctorData,
        id: doctorId,
        local_id: doctorData.id ? null : doctorId,
        sync_status: 'Pending' as SyncStatus,
      });



      if (this.isOnline) {
        await this.trySync();
      }

      return result;
    } catch (error) {
      console.error('Failed to add doctor to queue:', error);
      throw error;
    }
  }

  // Add test to queue
  async addTest(testData: TestQueueData): Promise<any> {
    const testId = testData.id || this.generateId();

    try {
      const result = await this.storeTestLocally({
        ...testData,
        id: testId,
        local_id: testData.id ? null : testId,
        sync_status: 'Pending',
      });



      // If online, try immediate sync
      if (this.isOnline) {
        await this.trySync();
      }

      return result;
    } catch (error) {
      console.error('Failed to add test to queue:', error);
      throw error;
    }
  }

  // Store patient locally
  private async storePatientLocally(patientData: PatientQueueData & {
    id: string;
    sync_status: SyncStatus;
    is_deleted?: boolean
  }): Promise<any> {
    const { localPrisma } = await import('../db/local-client');

    // Check if patient already exists
    const existingPatient = await localPrisma.patient.findUnique({
      where: { id: patientData.id },
    });

    if (existingPatient) {
      // Update existing patient
      const updatedPatient = await localPrisma.patient.update({
        where: { id: patientData.id },
        data: {
          name: patientData.name,
          gender: patientData.gender,
          age_value: patientData.age_value,
          age_unit: patientData.age_unit,
          phone: patientData.phone,
          email: patientData.email,
          address: patientData.address,
          current_visit_number: patientData.current_visit_number || existingPatient.current_visit_number, // NEW
          sync_status: patientData.sync_status,
          is_deleted: patientData.is_deleted !== undefined ? patientData.is_deleted : existingPatient.is_deleted,
          updated_at: new Date(),
        },
      });



      return updatedPatient;
    } else {
      // Create new patient
      return await localPrisma.patient.create({
        data: {
          id: patientData.id,
          local_id: patientData.local_id,
          name: patientData.name,
          gender: patientData.gender,
          age_value: patientData.age_value,
          age_unit: patientData.age_unit,
          phone: patientData.phone,
          email: patientData.email,
          address: patientData.address,
          current_visit_number: patientData.current_visit_number || 1, // NEW: Default to 1
          sync_status: patientData.sync_status,
          is_deleted: patientData.is_deleted || false,
        },
      });
    }
  }

  // Store doctor locally
  private async storeDoctorLocally(doctorData: DoctorQueueData & { id: string; sync_status: SyncStatus }): Promise<any> {
    const { localPrisma } = await import('../db/local-client');

    const existingDoctor = await localPrisma.doctor.findUnique({
      where: { id: doctorData.id },
    });

    if (existingDoctor) {
      const updatedDoctor = await localPrisma.doctor.update({
        where: { id: doctorData.id },
        data: {
          name: doctorData.name,
          specialization: doctorData.specialization,
          phone: doctorData.phone,
          email: doctorData.email,
          clinic_address: doctorData.clinic_address,
          sync_status: doctorData.sync_status,
          updated_at: new Date(),
        },
      });

      // Log doctor update


      return updatedDoctor;
    } else {
      const newDoctor = await localPrisma.doctor.create({
        data: {
          id: doctorData.id,
          local_id: doctorData.local_id,
          name: doctorData.name,
          specialization: doctorData.specialization,
          phone: doctorData.phone,
          email: doctorData.email,
          clinic_address: doctorData.clinic_address,
          sync_status: doctorData.sync_status,
        },
      });

      return newDoctor;
    }
  }

  // Store test locally -> update the storeTestLocally function
  private async storeTestLocally(
    testData: TestQueueData & { id: string; sync_status: SyncStatus }
  ): Promise<any> {
    const { localPrisma } = await import('../db/local-client');

    const data: Prisma.TestUncheckedCreateInput = {
      id: testData.id,
      local_id: testData.local_id,
      patient_id: testData.patient_id,
      referring_doctor_id: testData.referring_doctor_id || null,
      test_type: testData.test_type,
      test_code: testData.test_code,
      test_template_id: testData.test_template_id || null,
      status: testData.status || 'Pending',
      units: testData.units,
      tested_at: testData.tested_at || null,
      completed_at: testData.completed_at || null,
      sync_status: testData.sync_status,
      // NEW: Visit-related fields
      visit_id: testData.visit_id || null,
      visit_number: testData.visit_number || 1,
      // Print/Archive fields
      is_printed: testData.is_printed || false,
      printed_at: testData.printed_at || null,
      printed_by: testData.printed_by || null,
      print_count: testData.print_count || 0,
    };

    // Handle JSON fields safely
    if (testData.results === null || testData.results === undefined) {
      data.results = Prisma.DbNull;
    } else {
      data.results = testData.results as Prisma.InputJsonValue;
    }

    if (testData.normal_range === null || testData.normal_range === undefined) {
      data.normal_range = Prisma.DbNull;
    } else {
      data.normal_range = testData.normal_range as Prisma.InputJsonValue;
    }

    const existingTest = await localPrisma.test.findUnique({
      where: { id: testData.id },
    });

    if (existingTest) {
      const updatedTest = await localPrisma.test.upsert({
        where: { id: testData.id },
        update: {
          ...data,
          test_template_id: testData.test_template_id || undefined,
          updated_at: new Date(),
        },
        create: data,
      });

      // ✅ AUDIT LOG: Log test update


      return updatedTest;
    } else {
      const newTest = await localPrisma.test.upsert({
        where: { id: testData.id },
        update: {
          ...data,
          test_template_id: testData.test_template_id || undefined,
          updated_at: new Date(),
        },
        create: data,
      });

      return newTest;
    }
  }

  // Try to sync pending changes
  private async trySync(): Promise<boolean> {
    try {
      // Use client-side method if in browser, otherwise direct call
      const syncResult = typeof window !== 'undefined'
        ? await SyncService.triggerSyncClient()
        : await SyncService.triggerSync();



      return syncResult;
    } catch (error) {
      // ✅ AUDIT LOG: Log sync failure


      return false;
    }
  }

  // Manual sync trigger
  async manualSync(): Promise<boolean> {
    try {
      // Use client-side method if in browser, otherwise direct call
      const result = typeof window !== 'undefined'
        ? await SyncService.triggerSyncClient()
        : await SyncService.triggerSync();



      return result;
    } catch (error) {


      return false;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();