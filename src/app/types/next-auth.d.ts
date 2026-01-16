import NextAuth from "next-auth";
import { Language } from '@prisma/client';

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: "SuperAdmin" | "Admin";
    preferred_language: string | null;
    language: Language.code | null;
    can_give_discount?: boolean;
    max_discount_percentage?: number | null;
    max_discount_amount?: number | null;
    discount_type?: 'Percentage' | 'Fixed' | null;
    is_active: boolean;
    can_create_test_templates?: boolean;
    can_edit_test_templates?: boolean;
    can_delete_test_templates?: boolean;
    can_edit_reference_ranges?: boolean;
    can_edit_fees?: boolean;
    can_view_test_templates?: boolean;
    can_archive_test_templates?: boolean;
    can_create_patients?: boolean;
    can_edit_patients?: boolean;
    can_delete_patients?: boolean;
    can_view_all_patients?: boolean;
    can_access_medical_history?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: "SuperAdmin" | "Admin";
      preferred_language: string | null;
      language: Language.code | null;
      can_give_discount?: boolean;
      max_discount_percentage?: number | null;
      max_discount_amount?: number | null;
      discount_type?: 'Percentage' | 'Fixed' | null;
      is_active: boolean;
      error?: string;
      can_create_test_templates?: boolean;
      can_edit_test_templates?: boolean;
      can_delete_test_templates?: boolean;
      can_edit_reference_ranges?: boolean;
      can_edit_fees?: boolean;
      can_view_test_templates?: boolean;
      can_archive_test_templates?: boolean;
      can_create_patients?: boolean;
      can_edit_patients?: boolean;
      can_delete_patients?: boolean;
      can_view_all_patients?: boolean;
      can_access_medical_history?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    image?: string | null;
    role?: "SuperAdmin" | "Admin";
    preferred_language: string | null;
    language: Language.code | null;
    can_give_discount?: boolean;
    max_discount_percentage?: number | null;
    max_discount_amount?: number | null;
    discount_type?: 'Percentage' | 'Fixed' | null;
    is_active?: boolean;

    // Test Template Permissions
    can_create_test_templates?: boolean;
    can_edit_test_templates?: boolean;
    can_delete_test_templates?: boolean;
    can_edit_reference_ranges?: boolean;
    can_edit_fees?: boolean;
    can_view_test_templates?: boolean;
    can_archive_test_templates?: boolean;
    can_create_patients?: boolean;
    can_edit_patients?: boolean;
    can_delete_patients?: boolean;
    can_view_all_patients?: boolean;
    can_access_medical_history?: boolean;
  }
}
