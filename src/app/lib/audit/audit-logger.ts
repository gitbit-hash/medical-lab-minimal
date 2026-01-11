// app/lib/audit/audit-logger.ts
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client'; // Import Prisma namespace
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

export interface AuditLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  translationParams?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditLogger {
  static async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: data.userId,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId || null,
          description: data.description,
          translation_params: data.translationParams
            ? data.translationParams
            : Prisma.JsonNull,
          old_values: data.oldValues
            ? data.oldValues
            : Prisma.JsonNull,
          new_values: data.newValues
            ? data.newValues
            : Prisma.JsonNull,
          ip_address: data.ipAddress || null,
          user_agent: data.userAgent || null,
          metadata: data.metadata
            ? data.metadata
            : Prisma.JsonNull,
          created_at: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return false;
    }
  }

  // Specific log methods with translation keys
  static async logLogin(userId: string, userName: string, ip?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'USER_LOGIN',
      entityType: getTranslatedEntityType('User'),
      entityId: userId,
      description: 'audit.user_login',
      translationParams: {
        user_name: userName
      },
      newValues: {
        email: userName,
        login_timestamp: new Date().toISOString(),
        ip_address: ip,
      },
      ipAddress: ip,
      userAgent,
    });
  }

  static async logLogout(userId: string, userName: string, ip?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'USER_LOGOUT',
      entityType: getTranslatedEntityType('User'),
      entityId: userId,
      description: 'audit.user_logout',
      translationParams: {
        user_name: userName
      },
      newValues: {
        email: userName,
        logout_timestamp: new Date().toISOString(),
        ip_address: ip,
      },
      ipAddress: ip,
      userAgent,
    });
  }

  static async logFailedLogin(email: string, reason: string, ip?: string, userAgent?: string) {
    return this.log({
      userId: 'system',
      action: 'USER_LOGIN_FAILED',
      entityType: getTranslatedEntityType('User'),
      description: 'audit.user_login_failed',
      translationParams: {
        user_name: email
      },
      newValues: {
        attempted_email: email,
        reason,
        timestamp: new Date().toISOString(),
        ip_address: ip,
      },
      ipAddress: ip,
      userAgent,
    });
  }

  static async logLoginDenied(userId: string, email: string, ip?: string, userAgent?: string) {
    return this.log({
      userId: userId,
      action: 'USER_LOGIN_DENIED',
      entityType: getTranslatedEntityType('User'),
      entityId: userId,
      description: 'audit.user_login_denied',
      translationParams: {
        user_name: email
      },
      newValues: {
        attempted_email: email,
        reason: 'account_inactive',
        timestamp: new Date().toISOString(),
        ip_address: ip,
      },
      ipAddress: ip,
      userAgent,
    });
  }

  static async logPasswordChange(userId: string, userName: string, ip?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'PASSWORD_RESET',
      entityType: getTranslatedEntityType('User'),
      entityId: userId,
      description: 'audit.password_reset',
      translationParams: {
        user_name: userName
      },
      newValues: {
        email: userName,
        change_timestamp: new Date().toISOString(),
      },
      ipAddress: ip,
      userAgent,
    });
  }

  static async logCreatePatient(userId: string, patientId: string, patientName: string, patientData: any) {
    return this.log({
      userId,
      action: 'CREATE_PATIENT',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.create_patient',
      translationParams: {
        patient_name: patientName
      },
      newValues: patientData,
    });
  }

  static async logUpdatePatient(userId: string, patientId: string, patientName: string, oldData: any, newData: any) {
    return this.log({
      userId,
      action: 'UPDATE_PATIENT',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.update_patient',
      translationParams: {
        patient_name: patientName
      },
      oldValues: oldData,
      newValues: newData,
    });
  }

  static async logDeletePatient(userId: string, patientId: string, patientName: string, patientData: any) {
    return this.log({
      userId,
      action: 'DELETE_PATIENT',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.delete_patient',
      translationParams: {
        patient_name: patientName
      },
      oldValues: patientData,
    });
  }

  static async logCreateTest(userId: string, testId: string, testName: string, patientName: string, testData: any) {
    return this.log({
      userId,
      action: 'CREATE_TEST',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.create_test',
      translationParams: {
        test_name: testName,
        patient_name: patientName
      },
      newValues: testData,
    });
  }

  static async logUpdateTest(userId: string, testId: string, testName: string, oldData: any, newData: any) {
    return this.log({
      userId,
      action: 'UPDATE_TEST',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.update_test',
      translationParams: {
        test_name: testName
      },
      oldValues: oldData,
      newValues: newData,
    });
  }

  static async logDeleteTest(userId: string, testId: string, testName: string, testData: any) {
    return this.log({
      userId,
      action: 'DELETE_TEST',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.delete_test',
      translationParams: {
        test_name: testName
      },
      oldValues: testData,
    });
  }

  static async logCreateUser(userId: string, targetUserId: string, userName: string) {
    return this.log({
      userId,
      action: 'CREATE_USER',
      entityType: getTranslatedEntityType('User'),
      entityId: targetUserId,
      description: 'audit.user_created',
      translationParams: {
        user_name: userName
      },
    });
  }

  static async logUpdateUser(userId: string, targetUserId: string, userName: string, oldData: any, newData: any) {
    return this.log({
      userId,
      action: 'UPDATE_USER',
      entityType: getTranslatedEntityType('User'),
      entityId: targetUserId,
      description: 'audit.user_updated',
      translationParams: {
        user_name: userName
      },
      oldValues: oldData,
      newValues: newData,
    });
  }

  static async logActivateUser(userId: string, targetUserId: string, userName: string) {
    return this.log({
      userId,
      action: 'USER_ACTIVATED',
      entityType: getTranslatedEntityType('User'),
      entityId: targetUserId,
      description: 'audit.user_activated',
      translationParams: {
        user_name: userName
      },
    });
  }

  static async logDeactivateUser(userId: string, targetUserId: string, userName: string) {
    return this.log({
      userId,
      action: 'USER_DEACTIVATED',
      entityType: getTranslatedEntityType('User'),
      entityId: targetUserId,
      description: 'audit.user_deactivated',
      translationParams: {
        user_name: userName
      },
    });
  }

  static async logUserRoleChange(userId: string, targetUserId: string, userName: string, oldRole: string, newRole: string) {
    return this.log({
      userId,
      action: 'USER_ROLE_CHANGED',
      entityType: getTranslatedEntityType('User'),
      entityId: targetUserId,
      description: 'audit.user_role_changed',
      translationParams: {
        user_name: userName,
        old_role: oldRole,
        new_role: newRole
      },
    });
  }

  static async logDeleteUser(userId: string, targetUserId: string, userName: string) {
    return this.log({
      userId,
      action: 'DELETE_USER',
      entityType: getTranslatedEntityType('User'),
      entityId: targetUserId,
      description: 'audit.user_deleted',
      translationParams: {
        user_name: userName
      },
    });
  }

  static async logApplyDiscount(userId: string, patientId: string, patientName: string, discountValue: number | string, discountType: string) {
    return this.log({
      userId,
      action: 'APPLY_DISCOUNT',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.apply_discount',
      translationParams: {
        patient_name: patientName,
        discount_value: discountValue,
        discount_type: discountType
      },
    });
  }

  static async logRemoveDiscount(userId: string, patientId: string, patientName: string) {
    return this.log({
      userId,
      action: 'REMOVE_DISCOUNT',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.remove_discount',
      translationParams: {
        patient_name: patientName
      },
    });
  }

  static async logPaymentReceived(userId: string, patientId: string, patientName: string, amountPaid: number, amountDue: number) {
    return this.log({
      userId,
      action: 'PAYMENT_RECEIVED',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.payment_received',
      translationParams: {
        patient_name: patientName,
        amount_paid: amountPaid,
        amount_due: amountDue
      },
    });
  }

  static async logCreateTestsBatch(userId: string, patientId: string, patientName: string, testsCount: number, totalFees: number) {
    return this.log({
      userId,
      action: 'CREATE_TESTS_BATCH',
      entityType: getTranslatedEntityType('Test'),
      description: 'audit.create_tests_batch',
      translationParams: {
        patient_name: patientName,
        tests_count: testsCount,
        total_fees: totalFees
      },
    });
  }

  static async logAssignDoctors(userId: string, patientId: string, patientName: string, doctorsCount: number) {
    return this.log({
      userId,
      action: 'ASSIGN_DOCTORS',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.assign_doctors',
      translationParams: {
        patient_name: patientName,
        doctors_count: doctorsCount
      },
    });
  }

  static async logUpdateDoctors(userId: string, patientId: string, patientName: string, oldCount: number, newCount: number) {
    return this.log({
      userId,
      action: 'UPDATE_DOCTORS',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.update_doctors',
      translationParams: {
        patient_name: patientName,
        old_count: oldCount,
        new_count: newCount
      },
    });
  }

  static async logVisitPayment(userId: string, visitNumber: string, amountPaid: number) {
    return this.log({
      userId,
      action: 'VISIT_PAYMENT',
      entityType: getTranslatedEntityType('Visit'),
      description: 'audit.visit_payment',
      translationParams: {
        visit_number: visitNumber,
        amount_paid: amountPaid
      },
    });
  }

  static async logCreateVisit(userId: string, visitNumber: string, patientName: string) {
    return this.log({
      userId,
      action: 'CREATE_VISIT',
      entityType: getTranslatedEntityType('Visit'),
      description: 'audit.create_visit',
      translationParams: {
        visit_number: visitNumber,
        patient_name: patientName
      },
    });
  }

  static async logPrintTest(userId: string, testId: string, testName: string) {
    return this.log({
      userId,
      action: 'PRINT_TEST',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.print_test',
      translationParams: {
        test_name: testName
      },
    });
  }

  static async logArchiveTest(userId: string, testId: string, testName: string) {
    return this.log({
      userId,
      action: 'ARCHIVE_TEST',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.archive_test',
      translationParams: {
        test_name: testName
      },
    });
  }

  static async logBulkArchive(userId: string, count: number) {
    return this.log({
      userId,
      action: 'BULK_ARCHIVE',
      entityType: getTranslatedEntityType('Test'),
      description: 'audit.bulk_archive',
      translationParams: {
        count: count
      },
    });
  }

  static async logCollectPayment(userId: string, patientId: string, patientName: string, amount: number) {
    return this.log({
      userId,
      action: 'COLLECT_PAYMENT',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.collect_payment',
      translationParams: {
        patient_name: patientName,
        amount: amount
      },
    });
  }

  static async logAdditionalPayment(userId: string, patientId: string, patientName: string, amountPaid: number) {
    return this.log({
      userId,
      action: 'ADDITIONAL_PAYMENT_RECEIVED',
      entityType: getTranslatedEntityType('Patient'),
      entityId: patientId,
      description: 'audit.additional_payment_received',
      translationParams: {
        patient_name: patientName,
        amount_paid: amountPaid
      },
    });
  }

  static async logUpdateSettings(userId: string, settingKey: string) {
    return this.log({
      userId,
      action: 'UPDATE_SETTINGS',
      entityType: getTranslatedEntityType('System'),
      description: 'audit.update_settings',
      translationParams: {
        setting_key: settingKey
      },
    });
  }

  static async logDeleteExternalLab(userId: string, labId: string, labName: string) {
    return this.log({
      userId,
      action: 'DELETE_EXTERNAL_LAB',
      entityType: getTranslatedEntityType('ExternalLab'),
      entityId: labId,
      description: 'audit.delete_external_lab',
      translationParams: {
        lab_name: labName
      },
    });
  }

  static async logRemoveExternalLabAssignment(userId: string, testId: string, labName: string) {
    return this.log({
      userId,
      action: 'REMOVE_EXTERNAL_LAB_ASSIGNMENT',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.remove_external_lab_assignment',
      translationParams: {
        lab_name: labName
      },
    });
  }

  static async logAssignToExternalLab(userId: string, testId: string, labName: string) {
    return this.log({
      userId,
      action: 'ASSIGN_TO_EXTERNAL_LAB',
      entityType: getTranslatedEntityType('Test'),
      entityId: testId,
      description: 'audit.assign_to_external_lab',
      translationParams: {
        lab_name: labName
      },
    });
  }

  // Get user's recent audit logs
  static async getUserLogs(userId: string, limit: number = 50) {
    try {
      return await prisma.auditLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error);
      return [];
    }
  }

  // Search audit logs
  static async searchLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }) {
    try {
      const where: any = {};

      if (filters.userId) where.user_id = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.entityType) where.entity_type = filters.entityType;

      if (filters.startDate || filters.endDate) {
        where.created_at = {};
        if (filters.startDate) where.created_at.gte = filters.startDate;
        if (filters.endDate) where.created_at.lte = filters.endDate;
      }

      if (filters.searchTerm) {
        where.OR = [
          { description: { contains: filters.searchTerm, mode: 'insensitive' } },
          { ip_address: { contains: filters.searchTerm, mode: 'insensitive' } },
        ];
      }

      return await prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
        take: 100,
      });
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      return [];
    }
  }
}