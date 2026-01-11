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

// Base types without relations for API responses
export type TestCategoryBase = TestCategory;

// Test with doctor relation
export type TestWithDoctor = Test & {
  doctor: Doctor | null;
  patient_visit?: PatientVisit | null; // NEW: Add patient visit relation
};

export type DoctorForList = Doctor & {
  patients: {
    id: string;
  }[];
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

export type PatientWithDetails = Patient & {
  doctors: (PatientDoctor & {
    doctor: Doctor;
  })[];
  tests: (TestWithDoctor & {
    test_template?: TestTemplateWithCategory | null;
    created_by?: { name: string; email: string } | null;
    updated_by?: { name: string; email: string } | null;
    patient_visit?: PatientVisit | null; // NEW: Add patient visit relation
    external_lab?: ExternalLab | null;
    outsourcing_cost?: number | null;
  })[];
  discount_audits?: (DiscountAudit & {
    user: { name: string; email: string };
  })[];
  visits?: PatientVisit[]; // NEW: Add visits relation
};

// UPDATED: Use PrismaDiscountAudit as base
export type DiscountAudit = PrismaDiscountAudit & {
  user?: {
    name: string;
    email: string;
  };
  patient?: Patient;
};

export type TestWithTemplateAndUser = Test & {
  doctor: Doctor | null;
  test_template: TestTemplateWithCategory | null;
  created_by?: { name: string; email: string } | null;
  updated_by?: { name: string; email: string } | null;
  patient_visit?: PatientVisit | null; // NEW: Add patient visit relation
};

// Doctor with relations
export type DoctorWithRelations = Doctor & {
  locale?: string | null; // Add locale
  patients: (PatientDoctor & {
    patient: Patient & {
      tests: Test[];
    };
  })[];
  tests: Test[];
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

// Test with patient and doctor - UPDATED
export type TestWithPatientAndDoctor = Test & {
  patient: Patient;
  doctor: Doctor | null;
  patient_visit?: PatientVisit | null; // NEW: Add patient visit relation
};

// TestCategory with relations - make children and tests optional
export type TestCategoryWithChildren = TestCategory & {
  children?: TestCategoryWithChildren[];
  tests?: TestTemplateWithCategory[];
};

// TestTemplate with category
export type TestTemplateWithCategory = TestTemplate & {
  category: TestCategory;
};

export type TestTemplateWithCategoryAndParams = TestTemplate & {
  category: TestCategory;
  parameters: TestParameter[];
};

export type TestTemplateForList = TestTemplate & {
  category: TestCategory;
  parameters?: TestParameter[];
  _count?: {
    parameters: number;
  };
};

// TestParameter type
export type TestParameterWithTemplate = TestParameter & {
  test_template: TestTemplate;
};

// PatientDoctor with doctor relation
export type PatientDoctorWithDoctor = PatientDoctor & {
  doctor: Doctor;
};

// PatientDoctor with patient relation
export type PatientDoctorWithPatient = PatientDoctor & {
  patient: Patient;
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

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  header: ReportHeader;
  footer: ReportFooter;
  sections: ReportSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportHeader {
  logo?: string;
  labName: string;
  address: string;
  telephone: string;
  email: string;
  website: string;
}

export interface ReportFooter {
  signature: string;
  workingHours: string;
  notes: string;
}

export interface ReportSection {
  id: string;
  type: 'patient-info' | 'test-results' | 'signature' | 'custom';
  title: string;
  order: number;
  config: any;
}

// Add these to your types/index.ts
export interface DashboardStats {
  patientCount: number;
  doctorCount: number;
  testCount: number;
  pendingSyncCount: number;
  completedTestsCount: number;
  pendingTestsCount: number;
  todayTestsCount: number;
  weeklyRevenue: number;
}

export interface RecentTest {
  id: string;
  test_type: string;
  status: TestStatus;
  created_at: Date;
  patient: {
    name: string;
  };
  doctor?: {
    name: string;
  };
  test_template?: {
    fees: number;
  };
  visit_id?: string | null; // NEW: Add visit_id
  visit_number?: number | null; // NEW: Add visit_number
}

export interface SystemStatus {
  dbConnected: boolean;
  pendingSyncCount: number;
  activeUsers: number;
  newPatientsToday: number;
  todayTestsCount: number;
  completedTestsToday: number;
}

export interface TestTemplateBase {
  id: string;
  name: string;
  code: string;
  category_id: string;
  description?: string;
  specimen?: string;
  container?: string;
  volume?: string;
  storage?: string;
  methodology?: string;
  turnaround_time?: string;
  fees?: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  expired_at?: string | Date | null; // Allow both string and Date
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

export interface TestTemplateFormData extends Omit<TestTemplateBase, 'created_at' | 'updated_at' | 'expired_at'> {
  expired_at?: string; // Use string for form input
}

// NEW: PatientVisit with relations
export type PatientVisitWithRelations = PatientVisit & {
  patient: Patient;
  tests: TestWithRelations[];
};

// NEW: PatientVisit with details
export type PatientVisitWithDetails = PatientVisit & {
  patient: Patient;
  tests: (Test & {
    test_template: TestTemplateWithCategory | null;
    doctor: Doctor | null;
  })[];
};

// NEW: Financial summary for patient
export interface PatientFinancialSummary {
  total_amount: number;
  discount_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_status: PaymentStatus;
  visits: {
    id: string;
    visit_number: number;
    total_amount: number;
    amount_paid: number;
    amount_due: number;
    payment_status: PaymentStatus;
    date: Date;
  }[];
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

// NEW: Discount information
export interface DiscountInfo {
  amount: number;
  percentage: number;
  type: DiscountType;
  reason?: string | null;
  approved_by?: string | null;
}

// NEW: Visit creation data
export interface VisitCreationData {
  patient_id: string;
  visit_date?: Date;
  notes?: string;
  doctorIds?: string[];
  tests?: Array<{
    test_template_id: string;
    test_type: string;
    test_code?: string;
  }>;
  discount?: DiscountInfo;
  paymentInfo?: PaymentInfo;
}

// NEW: Test creation with visit
export interface TestCreationData {
  patient_id: string;
  visit_id?: string; // Optional: if not provided, will use current visit
  test_type: string;
  test_template_id?: string;
  test_code?: string;
  status?: TestStatus;
  results?: Record<string, unknown>;
}

// NEW: Patient creation with initial visit
export interface PatientCreationData {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age_value?: number | null;
  age_unit?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  doctorIds?: string[];
  tests?: Array<{
    test_template_id: string;
    test_type: string;
    test_code?: string;
  }>;
  discount?: DiscountInfo;
  paymentInfo?: PaymentInfo;
}

// NEW: API Response types
export interface ApiResponseWithPagination<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface VisitStats {
  totalVisits: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  averageTestsPerVisit: number;
  revenueThisMonth: number;
}

// NEW: For PDF generation
export interface ReceiptData {
  patient: Patient;
  visit?: PatientVisit;
  tests: Test[];
  discount?: DiscountInfo;
  paymentInfo: PaymentInfo;
  labSettings: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

// NEW: For financial calculations
export interface FinancialCalculationResult {
  testTotal: number;
  discountAmount: number;
  finalTotal: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
}