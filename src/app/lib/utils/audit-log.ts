// lib/utils/audit-log.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '../db/local-client';
import { AuditLogParams } from '@/app/types';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

export async function createAuditLog(params: AuditLogParams) {
  // Only run on server
  if (typeof window !== 'undefined') {
    console.warn('Audit log should only be called on server side');
    return;
  }

  try {
    const session = await getServerSession(authOptions);

    const auditLog = await localPrisma.auditLog.create({
      data: {
        user_id: session?.user?.id || 'system',
        action: params.action,
        entity_type: getTranslatedEntityType(params.entity_type),
        entity_id: params.entity_id,
        description: params.description,
        old_values: params.old_values,
        new_values: params.new_values,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        metadata: params.metadata,
        created_at: new Date(),
      },
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Convenience functions for common actions
export const auditLogger = {
  async userLogin(ip_address?: string, user_agent?: string) {
    return createAuditLog({
      action: 'USER_LOGIN',
      entity_type: getTranslatedEntityType('User'),
      description: 'User logged into the system',
      ip_address,
      user_agent,
    });
  },

  async userLogout() {
    return createAuditLog({
      action: 'USER_LOGOUT',
      entity_type: getTranslatedEntityType('User'),
      description: 'User logged out of the system',
    });
  },

  async createPatient(patientId: string, patientData: any) {
    return createAuditLog({
      action: 'CREATE_PATIENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: `Created patient: ${patientData.name}`,
      new_values: patientData,
    });
  },

  async updatePatient(patientId: string, oldData: any, newData: any) {
    return createAuditLog({
      action: 'UPDATE_PATIENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: `Updated patient: ${newData.name || oldData.name}`,
      old_values: oldData,
      new_values: newData,
    });
  },

  async deletePatient(patientId: string, patientData: any) {
    return createAuditLog({
      action: 'DELETE_PATIENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: `Deleted patient: ${patientData.name}`,
      old_values: patientData,
    });
  },

  async createDoctor(doctorId: string, doctorData: any) {
    return createAuditLog({
      action: 'CREATE_DOCTOR',
      entity_type: getTranslatedEntityType('Doctor'),
      entity_id: doctorId,
      description: `Created doctor: ${doctorData.name}`,
      new_values: doctorData,
    });
  },

  // ADD THIS MISSING METHOD
  async updateDoctor(doctorId: string, oldData: any, newData: any) {
    return createAuditLog({
      action: 'UPDATE_DOCTOR',
      entity_type: getTranslatedEntityType('Doctor'),
      entity_id: doctorId,
      description: `Updated doctor: ${newData.name || oldData.name}`,
      old_values: oldData,
      new_values: newData,
    });
  },

  // ADD THIS MISSING METHOD
  async deleteDoctor(doctorId: string, doctorData: any) {
    return createAuditLog({
      action: 'DELETE_DOCTOR',
      entity_type: getTranslatedEntityType('Doctor'),
      entity_id: doctorId,
      description: `Deleted doctor: ${doctorData.name}`,
      old_values: doctorData,
    });
  },

  async createTest(testId: string, testData: any) {
    return createAuditLog({
      action: 'CREATE_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: `Created test: ${testData.test_type}`,
      new_values: testData,
    });
  },

  async updateTest(testId: string, oldData: any, newData: any) {
    return createAuditLog({
      action: 'UPDATE_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: `Updated test: ${newData.test_type || oldData.test_type}`,
      old_values: oldData,
      new_values: newData,
    });
  },

  async syncOperation(operation: string, details: any) {
    return createAuditLog({
      action: 'SYNC_DATA',
      entity_type: getTranslatedEntityType('System'),
      description: `Sync operation: ${operation}`,
      metadata: details,
    });
  }
};