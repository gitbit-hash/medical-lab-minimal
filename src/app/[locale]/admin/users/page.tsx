// app/[locale]/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from "../../../lib/db/local-client";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { UsersPageClient } from "./users-page-client";
import { notFound } from 'next/navigation';
import { revalidatePath } from "next/cache";
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface UsersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ManageAdminsPage({ params }: UsersPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  if (!session || session.user?.role !== "SuperAdmin") {
    redirect(`/${locale}`);
  }

  // Fetch users with discount permissions
  const users = await localPrisma.user.findMany({
    where: { role: { in: ["Admin", "SuperAdmin"] } },
    orderBy: { created_at: "desc" },
    include: {
      language: true
    }
  });

  // Create admin server action
  async function createAdmin(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string || "Admin";

    const hashed = await bcrypt.hash(password, 10);

    // Check if role is SuperAdmin to set all permissions to true
    const isSuperAdmin = role === "SuperAdmin";

    // Prepare create data - set all permissions based on role
    const createData: any = {
      name,
      email,
      password_hash: hashed,
      role: role as "Admin" | "SuperAdmin",
      is_active: true,

      // Set all permissions to true for SuperAdmin, false for Admin
      can_give_discount: isSuperAdmin,
      max_discount_percentage: isSuperAdmin ? 100 : null,
      max_discount_amount: isSuperAdmin ? 1000 : null,
      discount_type: isSuperAdmin ? "Percentage" : null,

      // Test template permissions
      can_edit_test_templates: isSuperAdmin,
      can_create_test_templates: isSuperAdmin,
      can_delete_test_templates: isSuperAdmin,
      can_edit_reference_ranges: isSuperAdmin,
      can_edit_fees: isSuperAdmin,
      can_archive_test_templates: isSuperAdmin,
      can_view_test_templates: isSuperAdmin,

      // Patient permissions
      can_create_patients: isSuperAdmin,
      can_edit_patients: isSuperAdmin,
      can_delete_patients: isSuperAdmin,
      can_view_all_patients: isSuperAdmin,
      can_access_medical_history: isSuperAdmin,
    };

    const newUser = await localPrisma.user.create({
      data: createData,
    });

    // Create audit log for user creation with translation
    await localPrisma.auditLog.create({
      data: {
        user_id: session?.user?.id || '', // Current admin performing the action
        action: 'CREATE_USER',
        entity_type: getTranslatedEntityType('User'),
        entity_id: newUser.id,
        description: 'audit.user_created_with_role',
        translation_params: {
          user_name: newUser.email,
          role: role
        },
        new_values: JSON.parse(JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          is_active: newUser.is_active,
          can_give_discount: newUser.can_give_discount,
          max_discount_percentage: newUser.max_discount_percentage,
          max_discount_amount: newUser.max_discount_amount,
          discount_type: newUser.discount_type,
        })),
        created_at: new Date(),
      },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  // Update admin server action
  async function updateAdmin(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SuperAdmin") {
      throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const is_active = formData.get("is_active") === "true";

    // Get the previous user data to check if role is being changed
    const previousUser = await localPrisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    // Check if role is SuperAdmin to set all permissions to true
    const isSuperAdmin = role === "SuperAdmin";

    // Get permission values from form if provided, otherwise default based on role
    const can_give_discount = formData.get("can_give_discount") === "true";
    const maxDiscountPercentage = formData.get("maxDiscountPercentage") as string;
    const maxDiscountAmount = formData.get("maxDiscountAmount") as string;
    const discountType = formData.get("discountType") as string;

    // Get test template permissions
    let can_edit_test_templates = formData.get("can_edit_test_templates") === "true";
    let can_create_test_templates = formData.get("can_create_test_templates") === "true";
    let can_delete_test_templates = formData.get("can_delete_test_templates") === "true";
    let can_edit_reference_ranges = formData.get("can_edit_reference_ranges") === "true";
    let can_edit_fees = formData.get("can_edit_fees") === "true";
    let can_archive_test_templates = formData.get("can_archive_test_templates") === "true";
    let can_view_test_templates = formData.get("can_view_test_templates") === "true";

    // Get patient permissions
    let can_create_patients = formData.get("can_create_patients") === "true";
    let can_edit_patients = formData.get("can_edit_patients") === "true";
    let can_delete_patients = formData.get("can_delete_patients") === "true";
    let can_view_all_patients = formData.get("can_view_all_patients") === "true";
    let can_access_medical_history = formData.get("can_access_medical_history") === "true";

    // If role is being changed to SuperAdmin, force all permissions to true
    if (previousUser?.role !== "SuperAdmin" && isSuperAdmin) {
      // Set all permissions to true for SuperAdmin
      can_edit_test_templates = true;
      can_create_test_templates = true;
      can_delete_test_templates = true;
      can_edit_reference_ranges = true;
      can_edit_fees = true;
      can_archive_test_templates = true;
      can_view_test_templates = true;

      can_create_patients = true;
      can_edit_patients = true;
      can_delete_patients = true;
      can_view_all_patients = true;
      can_access_medical_history = true;
    }

    // Get current user data for audit logging
    const currentUser = await localPrisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        role: true,
        is_active: true,
        can_give_discount: true,
        max_discount_percentage: true,
        max_discount_amount: true,
        discount_type: true,
      }
    });

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role: role as "Admin" | "SuperAdmin",
      is_active,
      can_give_discount,
      can_edit_test_templates,
      can_create_test_templates,
      can_delete_test_templates,
      can_edit_reference_ranges,
      can_edit_fees,
      can_archive_test_templates,
      can_view_test_templates,
      can_create_patients,
      can_edit_patients,
      can_delete_patients,
      can_view_all_patients,
      can_access_medical_history,
    };

    // Handle discount fields based on can_give_discount
    if (can_give_discount) {
      // Only set discount fields if can_give_discount is true
      updateData.max_discount_percentage = maxDiscountPercentage ? parseFloat(maxDiscountPercentage) : null;
      updateData.max_discount_amount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;

      // Validate discountType - only set if it's a valid enum value
      if (discountType === "Percentage" || discountType === "Fixed") {
        updateData.discount_type = discountType;
      } else {
        updateData.discount_type = null;
      }
    } else {
      // If can_give_discount is false, clear all discount fields
      updateData.max_discount_percentage = null;
      updateData.max_discount_amount = null;
      updateData.discount_type = null;
    }

    const updatedUser = await localPrisma.user.update({
      where: { id },
      data: updateData,
    });

    // Create audit log for user update with translation
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'UPDATE_USER',
        entity_type: getTranslatedEntityType('User'),
        entity_id: id,
        description: 'audit.user_updated',
        translation_params: {
          user_name: email,
          role: role
        },
        old_values: JSON.parse(JSON.stringify(currentUser)),
        new_values: JSON.parse(JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          is_active: updatedUser.is_active,
          can_give_discount: updatedUser.can_give_discount,
          max_discount_percentage: updatedUser.max_discount_percentage,
          max_discount_amount: updatedUser.max_discount_amount,
          discount_type: updatedUser.discount_type,
        })),
        created_at: new Date(),
      },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  // Toggle user active status
  async function toggleUserActive(id: string, currentStatus: boolean) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SuperAdmin") {
      throw new Error("Unauthorized");
    }

    // Prevent deactivating yourself
    if (session.user.id === id) {
      throw new Error("Cannot deactivate yourself");
    }

    // Get current user data for audit logging
    const currentUser = await localPrisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        is_active: true,
      }
    });

    const newStatus = !currentStatus;
    const updatedUser = await localPrisma.user.update({
      where: { id },
      data: { is_active: newStatus },
    });

    // Create audit log for status change with translation
    const action = newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    const descriptionKey = newStatus ? 'audit.user_activated' : 'audit.user_deactivated';

    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: action,
        entity_type: getTranslatedEntityType('User'),
        entity_id: id,
        description: descriptionKey,
        translation_params: {
          user_name: currentUser?.email || 'Unknown'
        },
        old_values: JSON.parse(JSON.stringify({ is_active: currentStatus })),
        new_values: JSON.parse(JSON.stringify({ is_active: newStatus })),
        created_at: new Date(),
      },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  // Update user role
  async function updateUserRole(id: string, role: "Admin" | "SuperAdmin") {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SuperAdmin") {
      throw new Error("Unauthorized");
    }

    // Prevent changing your own role
    if (session.user.id === id) {
      throw new Error("Cannot change your own role");
    }

    // Get current user data for audit logging
    const currentUser = await localPrisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        role: true,
      }
    });

    const updatedUser = await localPrisma.user.update({
      where: { id },
      data: { role },
    });

    // Create audit log for role change with translation
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'USER_ROLE_CHANGED',
        entity_type: getTranslatedEntityType('User'),
        entity_id: id,
        description: 'audit.user_role_changed',
        translation_params: {
          user_name: currentUser?.email || 'Unknown',
          old_role: currentUser?.role || 'Unknown',
          new_role: role
        },
        old_values: JSON.parse(JSON.stringify({ role: currentUser?.role })),
        new_values: JSON.parse(JSON.stringify({ role })),
        created_at: new Date(),
      },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  // Delete user with audit logging
  async function deleteUser(id: string) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SuperAdmin") {
      throw new Error("Unauthorized");
    }

    if (session.user.id === id) {
      throw new Error("Cannot delete yourself");
    }

    // Get user data before deletion for audit logging
    const userToDelete = await localPrisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        last_login_at: true,
        can_give_discount: true,
        max_discount_percentage: true,
        max_discount_amount: true,
        discount_type: true,
      }
    });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Create audit log BEFORE deletion with translation
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'DELETE_USER',
        entity_type: getTranslatedEntityType('User'),
        entity_id: id,
        description: 'audit.user_deleted',
        translation_params: {
          user_name: userToDelete.email
        },
        old_values: JSON.parse(JSON.stringify({
          name: userToDelete.name,
          email: userToDelete.email,
          role: userToDelete.role,
          is_active: userToDelete.is_active,
          created_at: userToDelete.created_at,
          last_login_at: userToDelete.last_login_at,
          can_give_discount: userToDelete.can_give_discount,
          max_discount_percentage: userToDelete.max_discount_percentage,
          max_discount_amount: userToDelete.max_discount_amount,
          discount_type: userToDelete.discount_type,
        })),
        created_at: new Date(),
      },
    });

    // Actually delete the user
    await localPrisma.user.delete({
      where: { id },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  // Reset password
  async function resetPassword(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SuperAdmin") {
      throw new Error("Unauthorized");
    }

    const id = formData.get("id") as string;
    const newPassword = formData.get("newPassword") as string;

    // Get user data for audit logging
    const user = await localPrisma.user.findUnique({
      where: { id },
      select: {
        email: true,
      }
    });

    const hashed = await bcrypt.hash(newPassword, 10);

    await localPrisma.user.update({
      where: { id },
      data: { password_hash: hashed },
    });

    // Create audit log for password reset with translation
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'PASSWORD_RESET',
        entity_type: getTranslatedEntityType('User'),
        entity_id: id,
        description: 'audit.password_reset',
        translation_params: {
          user_name: user?.email || 'Unknown'
        },
        created_at: new Date(),
      },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  // Update discount settings
  async function updateDiscountSettings(userId: string, updates: any) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SuperAdmin") {
      throw new Error("Unauthorized");
    }

    // Get current user data for audit logging
    const currentUser = await localPrisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        can_give_discount: true,
        max_discount_percentage: true,
        max_discount_amount: true,
        discount_type: true,
      }
    });

    // Build the update data object
    const updateData: any = {
      can_give_discount: updates.can_give_discount,
    };

    // Only set discount-related fields if can_give_discount is true
    if (updates.can_give_discount) {
      updateData.max_discount_percentage = updates.max_discount_percentage;
      updateData.max_discount_amount = updates.max_discount_amount;

      // Validate discount_type - only set if it's a valid enum value
      if (updates.discount_type === "Percentage" || updates.discount_type === "Fixed") {
        updateData.discount_type = updates.discount_type;
      } else {
        updateData.discount_type = null;
      }
    } else {
      // If disabling discount, clear the discount fields
      updateData.max_discount_percentage = null;
      updateData.max_discount_amount = null;
      updateData.discount_type = null;
    }

    // Update discount permissions
    const updatedUser = await localPrisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create audit log for the permission change with translation
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'UPDATE_DISCOUNT_PERMISSION',
        entity_type: getTranslatedEntityType('User'),
        entity_id: userId,
        description: 'audit.apply_discount_permission',
        translation_params: {
          user_name: currentUser?.email || 'Unknown'
        },
        old_values: JSON.parse(JSON.stringify({
          can_give_discount: currentUser?.can_give_discount,
          max_discount_percentage: currentUser?.max_discount_percentage,
          max_discount_amount: currentUser?.max_discount_amount,
          discount_type: currentUser?.discount_type,
        })),
        new_values: JSON.parse(JSON.stringify({
          can_give_discount: updatedUser.can_give_discount,
          max_discount_percentage: updatedUser.max_discount_percentage,
          max_discount_amount: updatedUser.max_discount_amount,
          discount_type: updatedUser.discount_type,
        })),
        created_at: new Date(),
      },
    });

    revalidatePath(`/${locale}/admin/users`);
  }

  return (
    <UsersPageClient
      locale={locale}
      users={users}
      createAdminAction={createAdmin}
      updateAdminAction={updateAdmin}
      toggleUserActiveAction={toggleUserActive}
      updateUserRoleAction={updateUserRole}
      deleteUserAction={deleteUser}
      resetPasswordAction={resetPassword}
      updateDiscountSettingsAction={updateDiscountSettings}
      currentUserId={session.user?.id}
    />
  );
}