// lib/utils/audit-log-client.ts (CLIENT-SIDE ONLY)
'use client';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

interface AuditLogParams {
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string; // Translation key starting with 'audit.'
  translation_params?: Record<string, any>;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
}

export const auditLoggerClient = {
  async createPatient(patientId: string, patientData: any) {
    return this.sendAuditLog({
      action: 'CREATE_PATIENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.create_patient',
      translation_params: {
        patient_name: patientData.name
      },
      new_values: patientData,
    });
  },

  async createTest(testId: string, testData: any, patientName?: string) {
    return this.sendAuditLog({
      action: 'CREATE_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.create_test',
      translation_params: {
        test_name: testData.test_type || testData.name,
        patient_name: patientName || testData.patient_name || 'Unknown'
      },
      new_values: testData,
    });
  },

  async addTestBatch(testsData: any, patientName: string, totalFees: number) {
    return this.sendAuditLog({
      action: 'CREATE_TESTS_BATCH',
      entity_type: getTranslatedEntityType('Test'),
      description: 'audit.create_tests_batch',
      translation_params: {
        tests_count: testsData.tests?.length || testsData.count || 0,
        patient_name: patientName,
        total_fees: totalFees
      },
      new_values: testsData,
    });
  },

  async userLogin(userName: string, ip_address?: string, user_agent?: string) {
    return this.sendAuditLog({
      action: 'USER_LOGIN',
      entity_type: getTranslatedEntityType('User'),
      description: 'audit.user_login',
      translation_params: {
        user_name: userName
      },
      ip_address,
      user_agent,
    });
  },

  async userLogout(userName: string) {
    return this.sendAuditLog({
      action: 'USER_LOGOUT',
      entity_type: getTranslatedEntityType('User'),
      description: 'audit.user_logout',
      translation_params: {
        user_name: userName
      },
    });
  },

  async updatePatient(patientId: string, oldData: any, newData: any) {
    return this.sendAuditLog({
      action: 'UPDATE_PATIENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.update_patient',
      translation_params: {
        patient_name: newData.name || oldData.name || 'Unknown'
      },
      old_values: oldData,
      new_values: newData,
    });
  },

  async deletePatient(patientId: string, patientData: any) {
    return this.sendAuditLog({
      action: 'DELETE_PATIENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.delete_patient',
      translation_params: {
        patient_name: patientData.name || 'Unknown'
      },
      old_values: patientData,
    });
  },

  async createDoctor(doctorId: string, doctorData: any) {
    return this.sendAuditLog({
      action: 'CREATE_DOCTOR',
      entity_type: getTranslatedEntityType('Doctor'),
      entity_id: doctorId,
      description: 'audit.create_doctor',
      translation_params: {
        doctor_name: doctorData.name
      },
      new_values: doctorData,
    });
  },

  async updateTest(testId: string, oldData: any, newData: any) {
    return this.sendAuditLog({
      action: 'UPDATE_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.update_test',
      translation_params: {
        test_name: newData.test_type || oldData.test_type || newData.name || oldData.name || 'Unknown'
      },
      old_values: oldData,
      new_values: newData,
    });
  },

  async deleteTest(testId: string, testData: any) {
    return this.sendAuditLog({
      action: 'DELETE_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.delete_test',
      translation_params: {
        test_name: testData.test_type || testData.name || 'Unknown'
      },
      old_values: testData,
    });
  },

  async syncOperation(operation: string, details: any) {
    return this.sendAuditLog({
      action: 'SYNC_DATA',
      entity_type: getTranslatedEntityType('System'),
      description: 'audit.sync_operation',
      translation_params: {
        operation: operation
      },
      metadata: details,
    });
  },

  async assignDoctors(patientId: string, doctorsCount: number, patientName: string) {
    return this.sendAuditLog({
      action: 'ASSIGN_DOCTORS',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.assign_doctors',
      translation_params: {
        doctors_count: doctorsCount,
        patient_name: patientName
      },
    });
  },

  async updateDoctors(patientId: string, oldCount: number, newCount: number, patientName: string) {
    return this.sendAuditLog({
      action: 'UPDATE_DOCTORS',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.update_doctors',
      translation_params: {
        patient_name: patientName,
        old_count: oldCount,
        new_count: newCount
      },
    });
  },

  async applyDiscount(patientId: string, discountValue: number | string, discountType: string, patientName: string) {
    return this.sendAuditLog({
      action: 'APPLY_DISCOUNT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.apply_discount',
      translation_params: {
        discount_value: discountValue,
        discount_type: discountType,
        patient_name: patientName
      },
    });
  },

  async removeDiscount(patientId: string, patientName: string) {
    return this.sendAuditLog({
      action: 'REMOVE_DISCOUNT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.remove_discount',
      translation_params: {
        patient_name: patientName
      },
    });
  },

  async paymentReceived(patientId: string, amountPaid: number, amountDue: number, patientName: string) {
    return this.sendAuditLog({
      action: 'PAYMENT_RECEIVED',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.payment_received',
      translation_params: {
        amount_paid: amountPaid,
        amount_due: amountDue,
        patient_name: patientName
      },
    });
  },

  async additionalPayment(patientId: string, amountPaid: number, patientName: string) {
    return this.sendAuditLog({
      action: 'ADDITIONAL_PAYMENT_RECEIVED',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.additional_payment_received',
      translation_params: {
        amount_paid: amountPaid,
        patient_name: patientName
      },
    });
  },

  async visitPayment(visitNumber: string, amountPaid: number) {
    return this.sendAuditLog({
      action: 'VISIT_PAYMENT',
      entity_type: getTranslatedEntityType('Visit'),
      description: 'audit.visit_payment',
      translation_params: {
        visit_number: visitNumber,
        amount_paid: amountPaid
      },
    });
  },

  async createVisit(visitNumber: string, patientName: string) {
    return this.sendAuditLog({
      action: 'CREATE_VISIT',
      entity_type: getTranslatedEntityType('Visit'),
      description: 'audit.create_visit',
      translation_params: {
        visit_number: visitNumber,
        patient_name: patientName
      },
    });
  },

  async printTest(testId: string, testName: string) {
    return this.sendAuditLog({
      action: 'PRINT_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.print_test',
      translation_params: {
        test_name: testName
      },
    });
  },

  async archiveTest(testId: string, testName: string) {
    return this.sendAuditLog({
      action: 'ARCHIVE_TEST',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.archive_test',
      translation_params: {
        test_name: testName
      },
    });
  },

  async bulkArchive(count: number) {
    return this.sendAuditLog({
      action: 'BULK_ARCHIVE',
      entity_type: getTranslatedEntityType('Test'),
      description: 'audit.bulk_archive',
      translation_params: {
        count: count
      },
    });
  },

  async collectPayment(patientId: string, amount: number, patientName: string) {
    return this.sendAuditLog({
      action: 'COLLECT_PAYMENT',
      entity_type: getTranslatedEntityType('Patient'),
      entity_id: patientId,
      description: 'audit.collect_payment',
      translation_params: {
        amount: amount,
        patient_name: patientName
      },
    });
  },

  async updateUser(userId: string, userName: string) {
    return this.sendAuditLog({
      action: 'UPDATE_USER',
      entity_type: getTranslatedEntityType('User'),
      entity_id: userId,
      description: 'audit.user_updated',
      translation_params: {
        user_name: userName
      },
    });
  },

  async deleteUser(userId: string, userName: string) {
    return this.sendAuditLog({
      action: 'DELETE_USER',
      entity_type: getTranslatedEntityType('User'),
      entity_id: userId,
      description: 'audit.user_deleted',
      translation_params: {
        user_name: userName
      },
    });
  },

  async activateUser(userId: string, userName: string) {
    return this.sendAuditLog({
      action: 'USER_ACTIVATED',
      entity_type: getTranslatedEntityType('User'),
      entity_id: userId,
      description: 'audit.user_activated',
      translation_params: {
        user_name: userName
      },
    });
  },

  async deactivateUser(userId: string, userName: string) {
    return this.sendAuditLog({
      action: 'USER_DEACTIVATED',
      entity_type: getTranslatedEntityType('User'),
      entity_id: userId,
      description: 'audit.user_deactivated',
      translation_params: {
        user_name: userName
      },
    });
  },

  async updateUserRole(userId: string, userName: string, oldRole: string, newRole: string) {
    return this.sendAuditLog({
      action: 'USER_ROLE_CHANGED',
      entity_type: getTranslatedEntityType('User'),
      entity_id: userId,
      description: 'audit.user_role_changed',
      translation_params: {
        user_name: userName,
        old_role: oldRole,
        new_role: newRole
      },
    });
  },

  async passwordReset(userId: string, userName: string) {
    return this.sendAuditLog({
      action: 'PASSWORD_RESET',
      entity_type: getTranslatedEntityType('User'),
      entity_id: userId,
      description: 'audit.password_reset',
      translation_params: {
        user_name: userName
      },
    });
  },

  async updateSettings(settingKey: string) {
    return this.sendAuditLog({
      action: 'UPDATE_SETTINGS',
      entity_type: getTranslatedEntityType('System'),
      description: 'audit.update_settings',
      translation_params: {
        setting_key: settingKey
      },
    });
  },

  async deleteExternalLab(labId: string, labName: string) {
    return this.sendAuditLog({
      action: 'DELETE_EXTERNAL_LAB',
      entity_type: getTranslatedEntityType('ExternalLab'),
      entity_id: labId,
      description: 'audit.delete_external_lab',
      translation_params: {
        lab_name: labName
      },
    });
  },

  async removeExternalLabAssignment(testId: string, labName: string) {
    return this.sendAuditLog({
      action: 'REMOVE_EXTERNAL_LAB_ASSIGNMENT',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.remove_external_lab_assignment',
      translation_params: {
        lab_name: labName
      },
    });
  },

  async assignToExternalLab(testId: string, labName: string) {
    return this.sendAuditLog({
      action: 'ASSIGN_TO_EXTERNAL_LAB',
      entity_type: getTranslatedEntityType('Test'),
      entity_id: testId,
      description: 'audit.assign_to_external_lab',
      translation_params: {
        lab_name: labName
      },
    });
  },

  async sendAuditLog(params: AuditLogParams) {
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        console.error('Failed to send audit log via API');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send audit log:', error);
    }
  }
};