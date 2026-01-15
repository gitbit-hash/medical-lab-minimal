// types/index.ts
import {
  Patient,
  Doctor,
  Test,
  PatientDoctor,
  TestStatus,
  TestTemplate,
  TestCategory,
  PatientVisit, // NEW: Import PatientVisit
  DiscountType, // NEW: Import DiscountType
  PaymentStatus, // NEW: Import PaymentStatus
  DiscountAudit as PrismaDiscountAudit,
  User,
  CasaAnalysis,
  ExternalLab
} from '@prisma/client';

// Re-export everything from sync
export * from './sync';

// Re-export Prisma types
export type {
  Doctor,
  Patient,
  Test,
  PatientDoctor,
  TestStatus,
  TestTemplate,
  TestCategory,
  PatientVisit, // NEW: Export PatientVisit
  DiscountType, // NEW: Export DiscountType
  PaymentStatus, // NEW: Export PaymentStatus
  User
};

// Test with doctor relation
export type TestWithDoctor = Test & {
  doctor: Doctor | null;
  patient_visit?: PatientVisit | null; // NEW: Add patient visit relation
};

// Patient with relations - UPDATED
export type PatientWithRelations = Patient & {
  doctors: (PatientDoctor & {
    doctor: Doctor;
  })[];
  tests: TestWithDoctor[];
  visits?: PatientVisit[]; // NEW: Add visits relation
  discount_audits?: DiscountAudit[]; // NEW: Add discount audits
};

// UPDATED: Use PrismaDiscountAudit as base
export type DiscountAudit = PrismaDiscountAudit & {
  user?: {
    name: string;
    email: string;
  };
  patient?: Patient;
};

// Test with relations - UPDATED
export type TestWithRelations = Test & {
  patient: Patient;
  doctor: Doctor | null;
  test_template: TestTemplateWithCategoryAndParams | null;
  patient_visit?: PatientVisit | null; // NEW: Add patient visit relation
  casa_analysis?: CasaAnalysis
  external_lab_id?: string | null;
  external_lab?: ExternalLab | null;
  outsourcing_cost?: number | null;
};

// TestTemplate with category
export type TestTemplateWithCategory = TestTemplate & {
  category: TestCategory;
};

export type TestTemplateWithCategoryAndParams = TestTemplate & {
  category: TestCategory;
  parameters: TestParameter[];
};

// API response types for test selection
export type TestCategoryTree = TestCategory & {
  children?: TestCategoryTree[];
  tests?: TestTemplateWithCategory[];
};

export type TestTemplateSearchResult = TestTemplate & {
  category: TestCategory;
  parameters: TestParameter[]; // Add this
};

// In your types, make code required or handle null cases better
export interface TestParameter {
  id: string;
  test_template_id: string;
  name: string;
  code: string; // Make this required, not string | null
  units: string | null;
  normal_range_min: number | null;
  normal_range_max: number | null;
  normal_range_text: string | null;
  is_critical: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  default_value: string | null;
}

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT'
  | 'DELETE_PATIENT'
  | 'CREATE_DOCTOR'
  | 'UPDATE_DOCTOR'
  | 'DELETE_DOCTOR'
  | 'CREATE_TEST'
  | 'UPDATE_TEST'
  | 'DELETE_TEST'
  | 'CREATE_TEST_TEMPLATE'
  | 'UPDATE_TEST_TEMPLATE'
  | 'DELETE_TEST_TEMPLATE'
  | 'SYNC_DATA'
  | 'EXPORT_REPORT'
  | 'APPLY_DISCOUNT'
  | 'REMOVE_DISCOUNT'
  | 'CREATE_VISIT'
  | 'VISIT_PAYMENT'
  | 'PAYMENT_RECEIVED'
  | 'PRINT_TEST'
  | 'USER_LOGIN_DENIED'
  | 'USER_LOGIN_FAILED'
  | 'CREATE_TESTS_BATCH'
  | 'CREATE_TESTS_BATCH'
  | 'CREATE_TESTS_BATCH'
  ;

export interface AuditLogParams {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  description?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  translation_params?: any;
}

// NEW: Payment information
export interface PaymentInfo {
  amount_paid: number;
  amount_due: number;
  payment_status: PaymentStatus;
  payment_method?: string | null;
  receipt_number?: string | null;
  payment_notes?: string | null;
}