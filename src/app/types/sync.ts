// types/sync.ts
import { SyncStatus, TestStatus, Patient, Doctor, Test, PatientDoctor } from '@prisma/client';

// Sync Types
export interface SyncResult {
  success: boolean;
  syncedPatients: number;
  syncedDoctors: number;
  syncedTests: number;
  conflicts: number;
  errors: string[];
}

export interface SyncStatusData {
  pendingPatients: number;
  pendingDoctors: number;
  pendingTests: number;
  isOnline: boolean;
}

// Queue Data Types
export interface PatientQueueData {
  id?: string;
  local_id?: string | null;
  name: string;
  gender?: 'Male' | 'Female' | 'Other';
  age_value?: number | null;
  age_unit?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  sync_status?: SyncStatus;
  is_deleted?: boolean;
  total_amount?: number;
  amount_due?: number;
  amount_paid?: number;
  payment_status?: string;
  discount_amount?: number;
  discount_percentage?: number;
  discount_type?: string | null;
  discount_reason?: string | null;
  current_visit_number?: number;
}

export interface DoctorQueueData {
  id?: string;
  local_id?: string | null;
  name: string;
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
  clinic_address?: string | null;
  sync_status?: SyncStatus;
}

export interface TestQueueData {
  id?: string;
  local_id?: string | null;
  patient_id: string;
  referring_doctor_id?: string | null;
  test_type: string;
  test_code?: string | null;
  test_template_id: string | null;
  status?: TestStatus;
  results?: Record<string, unknown> | null;
  normal_range?: Record<string, unknown> | null;
  units?: string | null;
  tested_at?: Date | null;
  completed_at?: Date | null;
  sync_status?: SyncStatus;
  // Visit-related fields (NEW)
  visit_id?: string | null;
  visit_number?: number;
  // Print/Archive fields
  is_printed?: boolean;
  printed_at?: Date | null;
  printed_by?: string | null;
  print_count?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Form Data Types
export interface PatientFormData {
  name: string;
  gender?: 'Male' | 'Female' | 'Other';
  age_value?: string;
  age_unit?: string;
  phone?: string;
  email?: string;
  address?: string;
  doctorIds?: string[];
}

export interface DoctorFormData {
  name: string;
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
  clinic_address?: string | null;
}

export interface TestFormData {
  patient_id: string;
  referring_doctor_id?: string;
  test_type: string;
  test_code?: string;
  test_template_id?: string;
  status?: TestStatus;
  results?: Record<string, unknown>;
  normal_range?: Record<string, unknown>;
  units?: string;
  tested_at?: string;
  completed_at?: string;
  visit_id?: string; // NEW: Added for visit linkage
}