'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import {
  FaEdit,
  FaTrashAlt,
  FaLock,
  FaUnlock,
  FaSync,
  FaEye,
  FaEyeSlash,
  FaUserCog,
  FaCheck,
  FaTimes,
  FaSave,
  FaKey
} from 'react-icons/fa';
import { Dialog } from '../../../components/Dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  can_give_discount: boolean;
  max_discount_percentage: number | null;
  max_discount_amount: number | null;
  discount_type: 'Percentage' | 'Fixed' | null;
  last_login_at: Date | null;
  created_at: Date;
  language?: {
    code: string;
    name: string;
  } | null;
  // Add test template permissions
  can_create_test_templates?: boolean;
  can_edit_test_templates?: boolean;
  can_delete_test_templates?: boolean;
  can_edit_reference_ranges?: boolean;
  can_edit_fees?: boolean;
  can_archive_test_templates?: boolean;
  can_view_test_templates?: boolean;
  can_create_patients?: boolean;
  can_edit_patients?: boolean;
  can_delete_patients?: boolean;
  can_view_all_patients?: boolean;
  can_access_medical_history?: boolean;
}

interface UsersPageClientProps {
  locale: string;
  users: User[];
  createAdminAction: (formData: FormData) => Promise<void>;
  updateAdminAction: (formData: FormData) => Promise<void>;
  toggleUserActiveAction: (id: string, currentStatus: boolean) => Promise<void>;
  updateUserRoleAction: (id: string, role: "Admin" | "SuperAdmin") => Promise<void>;
  deleteUserAction: (id: string) => Promise<void>;
  resetPasswordAction: (formData: FormData) => Promise<void>;
  updateDiscountSettingsAction: (userId: string, updates: any) => Promise<void>;
  currentUserId: string;
}

type ModalTab = 'basic' | 'permissions' | 'password';

export function UsersPageClient({
  locale,
  users,
  createAdminAction,
  updateAdminAction,
  toggleUserActiveAction,
  updateUserRoleAction,
  deleteUserAction,
  resetPasswordAction,
  updateDiscountSettingsAction,
  currentUserId
}: UsersPageClientProps) {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('basic');
  const [userSettings, setUserSettings] = useState<User[]>([]);

  // Basic form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'SuperAdmin'>('Admin');
  const [isActive, setIsActive] = useState(true);

  // Discount permission states
  const [canGiveDiscount, setCanGiveDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed' | ''>('');
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState<number | ''>('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');

  // Test template permission states
  const [canCreateTestTemplates, setCanCreateTestTemplates] = useState(false);
  const [canEditTestTemplates, setCanEditTestTemplates] = useState(false);
  const [canDeleteTestTemplates, setCanDeleteTestTemplates] = useState(false);
  const [canEditReferenceRanges, setCanEditReferenceRanges] = useState(false);
  const [canEditFees, setCanEditFees] = useState(false);
  const [canArchiveTestTemplates, setCanArchiveTestTemplates] = useState(false);
  const [canViewTestTemplates, setcanViewTestTemplates] = useState(false);

  // Patient Management Permissions states
  const [canCreatePatients, setCanCreatePatients] = useState(false);
  const [canEditPatients, setCanEditPatients] = useState(false);
  const [canDeletePatients, setCanDeletePatients] = useState(false);
  const [canViewAllPatients, setCanViewAllPatients] = useState(false);
  const [canAccessMedicalHistory, setCanAccessMedicalHistory] = useState(false);

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'confirm' | 'alert' | 'info' | 'success' | 'warning' | 'error',
    confirmText: '',
    cancelText: '',
    onConfirm: () => { },
    onCancel: () => { },
    isDestructive: false
  });

  const t = useTranslations('AdminUsersPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Check if selected user is the current user
  const isCurrentUser = selectedUser?.id === currentUserId;
  // Check if current user is SuperAdmin
  const isCurrentUserSuperAdmin = users.find(u => u.id === currentUserId)?.role === 'SuperAdmin';
  // Check if editing current SuperAdmin
  const isEditingCurrentSuperAdmin = isCurrentUser && selectedUser?.role === 'SuperAdmin';

  // Initialize user settings
  useEffect(() => {
    setUserSettings(users);
  }, [users]);

  // Initialize form when user is selected
  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name);
      setEmail(selectedUser.email);
      setRole(selectedUser.role as 'Admin' | 'SuperAdmin');
      setIsActive(selectedUser.is_active);

      // If editing current SuperAdmin, set discount to 100% and disable editing
      if (isEditingCurrentSuperAdmin) {
        setCanGiveDiscount(true);
        setDiscountType('Percentage');
        setMaxDiscountPercentage(100);
        setMaxDiscountAmount('');

        // Set all permissions to true for current SuperAdmin
        setCanCreateTestTemplates(true);
        setCanEditTestTemplates(true);
        setCanDeleteTestTemplates(true);
        setCanEditReferenceRanges(true);
        setCanEditFees(true);
        setCanArchiveTestTemplates(true);
        setcanViewTestTemplates(true);
        setCanCreatePatients(true);
        setCanEditPatients(true);
        setCanDeletePatients(true);
        setCanViewAllPatients(true);
        setCanAccessMedicalHistory(true);
      } else {
        // For other users, load their current permissions
        setCanGiveDiscount(selectedUser.can_give_discount);
        setDiscountType(selectedUser.discount_type || '');
        setMaxDiscountPercentage(selectedUser.max_discount_percentage || '');
        setMaxDiscountAmount(selectedUser.max_discount_amount || '');

        // Initialize test template permissions
        setCanCreateTestTemplates(selectedUser.can_create_test_templates || false);
        setCanEditTestTemplates(selectedUser.can_edit_test_templates || false);
        setCanDeleteTestTemplates(selectedUser.can_delete_test_templates || false);
        setCanEditReferenceRanges(selectedUser.can_edit_reference_ranges || false);
        setCanEditFees(selectedUser.can_edit_fees || false);
        setCanArchiveTestTemplates(selectedUser.can_archive_test_templates || false);
        setcanViewTestTemplates(selectedUser.can_view_test_templates || false);

        // Initialize Patient Management Permissions
        setCanCreatePatients(selectedUser.can_create_patients || false);
        setCanEditPatients(selectedUser.can_edit_patients || false);
        setCanDeletePatients(selectedUser.can_delete_patients || false);
        setCanViewAllPatients(selectedUser.can_view_all_patients || false);
        setCanAccessMedicalHistory(selectedUser.can_access_medical_history || false);
      }

      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setActiveTab('basic');
    }
  }, [selectedUser, isEditingCurrentSuperAdmin]);

  // Show dialog helper function
  const showDialog = (config: {
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'info' | 'success' | 'warning' | 'error';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    isDestructive?: boolean;
  }) => {
    setDialog({
      isOpen: true,
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      confirmText: config.confirmText || t('actions.confirm'),
      cancelText: config.cancelText || t('actions.cancel'),
      onConfirm: config.onConfirm || (() => { }),
      onCancel: config.onCancel || (() => setDialog(prev => ({ ...prev, isOpen: false }))),
      isDestructive: config.isDestructive || false
    });
  };

  // Close dialog helper
  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Validate password
  const validatePassword = () => {
    if (newPassword && newPassword.length < 8) {
      setPasswordError(t('errors.passwordMinLength'));
      return false;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError(t('errors.passwordMismatch'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle save button click
  const handleSave = () => {
    // Validate password if needed
    if (activeTab === 'password' || newPassword) {
      if (!validatePassword()) {
        showDialog({
          title: t('errors.validationError'),
          message: passwordError,
          type: 'warning'
        });
        return;
      }
    }

    // Define the update logic
    const performUpdate = async () => {
      startTransition(async () => {
        try {
          // Create FormData for user update
          const userFormData = new FormData();
          userFormData.append('id', selectedUser!.id);
          userFormData.append('name', name);
          userFormData.append('email', email);
          userFormData.append('role', role);
          userFormData.append('is_active', isActive.toString());

          // Only add discount permissions if not editing current SuperAdmin
          if (!isEditingCurrentSuperAdmin) {
            userFormData.append('can_give_discount', canGiveDiscount.toString());
            userFormData.append('discountType', discountType);
            userFormData.append('maxDiscountPercentage', maxDiscountPercentage.toString());
            userFormData.append('maxDiscountAmount', maxDiscountAmount.toString());
          } else {
            // For current SuperAdmin, always set discount to 100%
            userFormData.append('can_give_discount', 'true');
            userFormData.append('discountType', 'Percentage');
            userFormData.append('maxDiscountPercentage', '100');
            userFormData.append('maxDiscountAmount', '');
          }

          // Add test template permissions - for current SuperAdmin, all are true
          if (isEditingCurrentSuperAdmin) {
            userFormData.append('can_create_test_templates', 'true');
            userFormData.append('can_edit_test_templates', 'true');
            userFormData.append('can_delete_test_templates', 'true');
            userFormData.append('can_edit_reference_ranges', 'true');
            userFormData.append('can_edit_fees', 'true');
            userFormData.append('can_archive_test_templates', 'true');
            userFormData.append('can_view_test_templates', 'true');
            userFormData.append('can_create_patients', 'true');
            userFormData.append('can_edit_patients', 'true');
            userFormData.append('can_delete_patients', 'true');
            userFormData.append('can_view_all_patients', 'true');
            userFormData.append('can_access_medical_history', 'true');
          } else {
            userFormData.append('can_create_test_templates', canCreateTestTemplates.toString());
            userFormData.append('can_edit_test_templates', canEditTestTemplates.toString());
            userFormData.append('can_delete_test_templates', canDeleteTestTemplates.toString());
            userFormData.append('can_edit_reference_ranges', canEditReferenceRanges.toString());
            userFormData.append('can_edit_fees', canEditFees.toString());
            userFormData.append('can_archive_test_templates', canArchiveTestTemplates.toString());
            userFormData.append('can_view_test_templates', canViewTestTemplates.toString());
            userFormData.append('can_create_patients', canCreatePatients.toString());
            userFormData.append('can_edit_patients', canEditPatients.toString());
            userFormData.append('can_delete_patients', canDeletePatients.toString());
            userFormData.append('can_view_all_patients', canViewAllPatients.toString());
            userFormData.append('can_access_medical_history', canAccessMedicalHistory.toString());
          }

          // Update user details
          await updateAdminAction(userFormData);

          // Update password if provided
          if (newPassword) {
            const passwordFormData = new FormData();
            passwordFormData.append('id', selectedUser!.id);
            passwordFormData.append('newPassword', newPassword);
            await resetPasswordAction(passwordFormData);
          }

          // Update discount settings if they were changed and not editing current SuperAdmin
          if (!isEditingCurrentSuperAdmin && (
            canGiveDiscount !== selectedUser?.can_give_discount ||
            discountType !== selectedUser?.discount_type ||
            maxDiscountPercentage !== selectedUser?.max_discount_percentage ||
            maxDiscountAmount !== selectedUser?.max_discount_amount
          )) {
            await updateDiscountSettingsAction(selectedUser!.id, {
              can_give_discount: canGiveDiscount,
              discount_type: discountType || null,
              max_discount_percentage: maxDiscountPercentage || null,
              max_discount_amount: maxDiscountAmount || null
            });
          }

          // Close modal and refresh
          setShowEditModal(false);
          setSelectedUser(null);
          router.refresh();

          // Show success dialog
          showDialog({
            title: t('messages.success'),
            message: t('messages.userUpdated'),
            type: 'success'
          });
        } catch (error) {
          console.error('Update failed:', error);
          showDialog({
            title: t('errors.updateFailed'),
            message: error instanceof Error ? error.message : t('errors.unknownError'),
            type: 'error'
          });
        }
      });
    };

    // Show confirmation dialog
    showDialog({
      title: t('actions.updateUser'),
      message: t('messages.confirmUpdate'),
      type: 'confirm',
      confirmText: t('actions.saveChanges'),
      cancelText: t('actions.cancel'),
      onConfirm: performUpdate,
      isDestructive: false
    });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const user = userSettings.find(u => u.id === id);
    if (!user) return;

    if (id === currentUserId && currentStatus) {
      showDialog({
        title: t('errors.cannotSelfAction'),
        message: t('errors.cannotDeactivateSelf'),
        type: 'warning'
      });
      return;
    }

    showDialog({
      title: currentStatus ? t('actions.deactivateUser') : t('actions.activateUser'),
      message: currentStatus
        ? t('messages.confirmDeactivate', { name: user.name })
        : t('messages.confirmActivate', { name: user.name }),
      type: 'confirm',
      confirmText: currentStatus ? t('actions.deactivate') : t('actions.activate'),
      cancelText: t('actions.cancel'),
      isDestructive: currentStatus,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await toggleUserActiveAction(id, currentStatus);
            router.refresh();
            showDialog({
              title: t('messages.success'),
              message: currentStatus
                ? t('messages.userDeactivated', { name: user.name })
                : t('messages.userActivated', { name: user.name }),
              type: 'success'
            });
          } catch (error) {
            console.error('Toggle active failed:', error);
            showDialog({
              title: t('errors.updateFailed'),
              message: error instanceof Error ? error.message : t('errors.unknownError'),
              type: 'error'
            });
          }
        });
      }
    });
  };

  const handleUpdateRole = async (id: string, role: "Admin" | "SuperAdmin") => {
    const user = userSettings.find(u => u.id === id);
    if (!user) return;

    if (id === currentUserId) {
      showDialog({
        title: t('errors.cannotSelfAction'),
        message: t('errors.cannotChangeOwnRole'),
        type: 'warning'
      });
      return;
    }

    showDialog({
      title: t('actions.changeRole'),
      message: t('messages.confirmRoleChange', {
        name: user.name,
        oldRole: user.role,
        newRole: role
      }),
      type: 'confirm',
      confirmText: t('actions.change'),
      cancelText: t('actions.cancel'),
      onConfirm: () => {
        startTransition(async () => {
          try {
            await updateUserRoleAction(id, role);
            router.refresh();
            showDialog({
              title: t('messages.success'),
              message: t('messages.roleChanged', { name: user.name, role }),
              type: 'success'
            });
          } catch (error) {
            console.error('Update role failed:', error);
            showDialog({
              title: t('errors.updateFailed'),
              message: error instanceof Error ? error.message : t('errors.unknownError'),
              type: 'error'
            });
          }
        });
      }
    });
  };

  const handleDeleteUser = async (id: string) => {
    const user = userSettings.find(u => u.id === id);
    if (!user) return;

    if (id === currentUserId) {
      showDialog({
        title: t('errors.cannotSelfAction'),
        message: t('errors.cannotDeleteSelf'),
        type: 'warning'
      });
      return;
    }

    showDialog({
      title: t('actions.deleteUser'),
      message: t('messages.confirmDelete', { name: user.name }),
      type: 'confirm',
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
      isDestructive: true,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteUserAction(id);
            router.refresh();
            showDialog({
              title: t('messages.success'),
              message: t('messages.userDeleted', { name: user.name }),
              type: 'success'
            });
          } catch (error) {
            console.error('Delete failed:', error);
            showDialog({
              title: t('errors.deleteFailed'),
              message: error instanceof Error ? error.message : t('errors.unknownError'),
              type: 'error'
            });
          }
        });
      }
    });
  };

  // Format date helper function
  const formatDate = (date: Date | null) => {
    if (!date) return t('labels.never');
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8" dir={direction}>
      {/* Header */}
      <div className="bg-linear-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{t('hero.title')}</h1>
        <p className="text-green-100">{t('hero.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Create Admin Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('createAdminForm.title')}</h2>
            <form action={createAdminAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createAdminForm.nameLabel')}
                </label>
                <input
                  name="name"
                  placeholder={t('createAdminForm.namePlaceholder')}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createAdminForm.emailLabel')}
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder={t('createAdminForm.emailPlaceholder')}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createAdminForm.passwordLabel')}
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder={t('createAdminForm.passwordPlaceholder')}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createAdminForm.roleLabel')}
                </label>
                <select
                  name="role"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="Admin"
                >
                  <option value="Admin">{t('roles.admin')}</option>
                  <option value="SuperAdmin">{t('roles.superAdmin')}</option>
                </select>
              </div>

              <button
                type="submit"
                onClick={(e) => {
                  // Add any client-side validation here
                }}
                disabled={isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? t('actions.creating') : t('createAdminForm.submitButton')}
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {t('adminList.title')}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {t('adminList.totalAdmins', { count: userSettings.length })}
                </span>
                <span className="text-sm text-gray-500">
                  {t('adminList.activeAdmins', {
                    count: userSettings.filter(a => a.is_active).length
                  })}
                </span>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : ''}`}>
                      {t('table.headers.user')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : ''}`}>
                      {t('table.headers.roleStatus')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : ''}`}>
                      {t('table.headers.discountStatus')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : ''}`}>
                      {t('table.headers.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userSettings.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 transition-colors ${user.id === currentUserId ? 'bg-blue-50' : ''
                        }`}
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            {user.can_give_discount && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                <FaUserCog className="text-white text-xs" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{user.name}</span>
                              {user.id === currentUserId && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {t('status.you')}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {t('labels.created')}: {formatDate(user.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${user.role === 'SuperAdmin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}>
                              {user.role}
                            </span>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {user.is_active ? (
                                <>
                                  <FaCheck className="mr-1" size={10} /> {t('status.active')}
                                </>
                              ) : (
                                <>
                                  <FaTimes className="mr-1" size={10} /> {t('status.inactive')}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Discount Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.can_give_discount
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {user.can_give_discount ? (
                              <>
                                <FaUserCog className="mr-1" size={10} />
                                {user.discount_type === 'Percentage' ? (
                                  <>{user.max_discount_percentage}%</>
                                ) : user.discount_type === 'Fixed' ? (
                                  <>${user.max_discount_amount}</>
                                ) : (
                                  t('status.enabled')
                                )}
                              </>
                            ) : (
                              t('status.disabled')
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {/* Role Dropdown - Disable for current user */}
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(
                              user.id,
                              e.target.value as "Admin" | "SuperAdmin"
                            )}
                            disabled={isPending || user.id === currentUserId || user.role === 'SuperAdmin'}
                            className="text-xs border border-gray-300 rounded p-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <option value="Admin">{t('roles.admin')}</option>
                            <option value="SuperAdmin">{t('roles.superAdmin')}</option>
                          </select>

                          {/* Active/Inactive Toggle - Disable for current user & Other SuperAdmin */}
                          {user.role !== 'SuperAdmin' ? (
                            <button
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              disabled={isPending || user.id === currentUserId || user.role === 'SuperAdmin'}
                              className={`p-1 rounded ${user.is_active
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                                } disabled:opacity-50 transition-colors`}
                              title={user.is_active ? t('actions.deactivate') : t('actions.activate')}
                            >
                              {user.is_active ? <FaUnlock size={14} /> : <FaLock size={14} />}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed transition-colors"
                              title={t(`messages.${user.id === currentUserId ? 'cannotDeactivateCurrentSuperAdmin' : 'cannotDeactivateOtherSuperAdmin'}`)}
                            >
                              <FaUnlock size={14} />
                            </button>
                          )
                          }

                          {/* Edit Button - Only show for current user if they are SuperAdmin */}
                          {user.id === currentUserId || user.role !== 'SuperAdmin' ? (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditModal(true);
                              }}
                              disabled={isPending}
                              className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 transition-colors"
                              title={t('actions.edit')}
                            >
                              <FaEdit size={14} />
                            </button>
                          ) : (
                            // For other SuperAdmins (not current user), show disabled button with tooltip
                            <button
                              disabled
                              className="p-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed transition-colors"
                              title={t('messages.cannotEditOtherSuperAdmin')}
                            >
                              <FaEdit size={14} />
                            </button>
                          )}

                          {/* Delete Button - Hide for current user and SuperAdmins */}
                          {user.id !== currentUserId && user.role !== 'SuperAdmin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isPending}
                              className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 transition-colors"
                              title={t('actions.delete')}
                            >
                              <FaTrashAlt size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
        onClose={closeDialog}
        isDestructive={dialog.isDestructive}
      />

      {/* Edit User Modal with Tabs */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {t('editUserForm.title')}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    {isEditingCurrentSuperAdmin && (
                      <p className="text-sm text-blue-600 mt-1">
                        {t('messages.editingOwnAccount')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'basic'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <FaEdit size={16} />
                      <span>{t('tabs.basicInfo')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('permissions')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'permissions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <FaUserCog size={16} />
                      <span>{t('tabs.permissions')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('password')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'password'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <FaKey size={16} />
                      <span>{t('tabs.password')}</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('editUserForm.nameLabel')}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('editUserForm.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('editUserForm.roleLabel')}
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'Admin' | 'SuperAdmin')}
                        disabled={isCurrentUser}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="Admin">{t('roles.admin')}</option>
                        <option value="SuperAdmin">{t('roles.superAdmin')}</option>
                      </select>
                      {isCurrentUser && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('messages.cannotChangeOwnRole')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('editUserForm.statusLabel')}
                      </label>
                      <select
                        value={isActive ? 'true' : 'false'}
                        onChange={(e) => setIsActive(e.target.value === 'true')}
                        disabled={isCurrentUser}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="true">{t('status.active')}</option>
                        <option value="false">{t('status.inactive')}</option>
                      </select>
                      {isCurrentUser && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('messages.cannotChangeOwnStatus')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div className="space-y-6">
                  {/* Add a note for SuperAdmin */}
                  {role === 'SuperAdmin' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {isEditingCurrentSuperAdmin
                          ? t('messages.currentSuperAdminAllPermissions')
                          : t('messages.superAdminAllPermissions')}
                      </p>
                    </div>
                  )}

                  {/* Discount Permissions */}
                  <div className={`p-4 bg-gray-50 rounded-lg ${role === 'SuperAdmin' ? 'cursor-not-allowed' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-800">
                          {t('permissions.discount.title')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isEditingCurrentSuperAdmin
                            ? t('messages.currentSuperAdminDiscountFixed')
                            : t('permissions.discount.description')}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => !isEditingCurrentSuperAdmin && setCanGiveDiscount(!canGiveDiscount)}
                          disabled={isEditingCurrentSuperAdmin}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${canGiveDiscount ? 'bg-blue-600' : 'bg-gray-200'
                            } ${isEditingCurrentSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${canGiveDiscount
                              ? (direction === 'rtl' ? '-translate-x-5' : 'translate-x-5')
                              : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {canGiveDiscount && (
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('permissions.discount.typeLabel')}
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="discountType"
                                value="Percentage"
                                checked={discountType === 'Percentage'}
                                onChange={(e) => {
                                  if (!isEditingCurrentSuperAdmin) {
                                    setDiscountType('Percentage');
                                    setMaxDiscountAmount('');
                                  }
                                }}
                                disabled={isEditingCurrentSuperAdmin}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <span className={`text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                                {t('types.percentage')}
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="discountType"
                                value="Fixed"
                                checked={discountType === 'Fixed'}
                                onChange={(e) => {
                                  if (!isEditingCurrentSuperAdmin) {
                                    setDiscountType('Fixed');
                                    setMaxDiscountPercentage('');
                                  }
                                }}
                                disabled={isEditingCurrentSuperAdmin}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <span className={`text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                                {t('types.fixed')}
                              </span>
                            </label>
                          </div>
                        </div>

                        {discountType === 'Percentage' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('permissions.discount.maxPercentage')}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={maxDiscountPercentage}
                                onChange={(e) => !isEditingCurrentSuperAdmin && setMaxDiscountPercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                disabled={isEditingCurrentSuperAdmin}
                                className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                placeholder="0-100%"
                              />
                              <span className="text-gray-600">%</span>
                            </div>
                            {isEditingCurrentSuperAdmin && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('messages.currentSuperAdminDiscountFixedAt100')}
                              </p>
                            )}
                          </div>
                        )}

                        {discountType === 'Fixed' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('permissions.discount.maxAmount')}
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={maxDiscountAmount}
                                onChange={(e) => !isEditingCurrentSuperAdmin && setMaxDiscountAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                disabled={isEditingCurrentSuperAdmin}
                                className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                placeholder="0.00"
                              />
                              <span className="text-gray-600">$</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Test Template Permissions */}
                  <div className="bg-gray-50 rounded-lg mt-4 p-4">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">
                      {t('permissions.otherPermissions')}
                    </h4>

                    {/* Test Templates Group */}
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        {t('permissions.groups.testTemplates')}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* View Test Templates */}
                        <div className="flex items-center">
                          <input
                            id="can_view_test_templates"
                            name="can_view_test_templates"
                            type="checkbox"
                            checked={canViewTestTemplates}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setcanViewTestTemplates(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_view_test_templates" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.viewTestTemplates')}
                          </label>
                        </div>

                        {/* Create Templates */}
                        <div className="flex items-center">
                          <input
                            id="can_create_test_templates"
                            name="can_create_test_templates"
                            type="checkbox"
                            checked={canCreateTestTemplates}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanCreateTestTemplates(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_create_test_templates" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.createTestTemplates')}
                          </label>
                        </div>

                        {/* Edit Templates */}
                        <div className="flex items-center">
                          <input
                            id="can_edit_test_templates"
                            name="can_edit_test_templates"
                            type="checkbox"
                            checked={canEditTestTemplates}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanEditTestTemplates(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_edit_test_templates" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.editTestTemplates')}
                          </label>
                        </div>

                        {/* Delete Templates */}
                        <div className="flex items-center">
                          <input
                            id="can_delete_test_templates"
                            name="can_delete_test_templates"
                            type="checkbox"
                            checked={canDeleteTestTemplates}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanDeleteTestTemplates(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_delete_test_templates" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.deleteTestTemplates')}
                          </label>
                        </div>

                        {/* Edit Reference Ranges */}
                        <div className="flex items-center">
                          <input
                            id="can_edit_reference_ranges"
                            name="can_edit_reference_ranges"
                            type="checkbox"
                            checked={canEditReferenceRanges}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanEditReferenceRanges(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_edit_reference_ranges" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.editReferenceRanges')}
                          </label>
                        </div>

                        {/* Edit Fees */}
                        <div className="flex items-center">
                          <input
                            id="can_edit_fees"
                            name="can_edit_fees"
                            type="checkbox"
                            checked={canEditFees}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanEditFees(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_edit_fees" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.editFees')}
                          </label>
                        </div>

                        {/* Archive Templates */}
                        <div className="flex items-center">
                          <input
                            id="can_archive_test_templates"
                            name="can_archive_test_templates"
                            type="checkbox"
                            checked={canArchiveTestTemplates}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanArchiveTestTemplates(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_archive_test_templates" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.archiveTestTemplates')}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Patients Group */}
                    <div>
                      <h5 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        {t('permissions.groups.patients')}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Create Patients */}
                        <div className="flex items-center">
                          <input
                            id="can_create_patients"
                            name="can_create_patients"
                            type="checkbox"
                            checked={canCreatePatients}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanCreatePatients(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_create_patients" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.createPatients')}
                          </label>
                        </div>

                        {/* Edit Patients */}
                        <div className="flex items-center">
                          <input
                            id="can_edit_patients"
                            name="can_edit_patients"
                            type="checkbox"
                            checked={canEditPatients}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanEditPatients(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_edit_patients" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.editPatients')}
                          </label>
                        </div>

                        {/* Delete Patients */}
                        <div className="flex items-center">
                          <input
                            id="can_delete_patients"
                            name="can_delete_patients"
                            type="checkbox"
                            checked={canDeletePatients}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanDeletePatients(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_delete_patients" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.deletePatients')}
                          </label>
                        </div>

                        {/* View All Patients */}
                        <div className="flex items-center">
                          <input
                            id="can_view_all_patients"
                            name="can_view_all_patients"
                            type="checkbox"
                            checked={canViewAllPatients}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanViewAllPatients(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_view_all_patients" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.viewAllPatients')}
                          </label>
                        </div>

                        {/* Can Access Medical History */}
                        <div className="flex items-center">
                          <input
                            id="can_access_medical_history"
                            name="can_access_medical_history"
                            type="checkbox"
                            checked={canAccessMedicalHistory}
                            onChange={(e) => !isEditingCurrentSuperAdmin && setCanAccessMedicalHistory(e.target.checked)}
                            disabled={isEditingCurrentSuperAdmin}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <label htmlFor="can_access_medical_history" className={`ml-2 block text-sm ${isEditingCurrentSuperAdmin ? 'text-gray-500' : 'text-gray-700'}`}>
                            {t('permissions.canAccessMedicalHistory')}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <FaKey className="text-yellow-600 mt-0.5" size={20} />
                      <div>
                        <h4 className="text-lg font-medium text-yellow-800">
                          {t('password.resetTitle')}
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {t('password.resetDescription')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('password.newPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (confirmPassword && e.target.value !== confirmPassword) {
                            setPasswordError(t('errors.passwordMismatch'));
                          } else {
                            setPasswordError('');
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder={t('password.newPasswordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                      >
                        {showNewPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('password.confirmPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (newPassword && e.target.value !== newPassword) {
                            setPasswordError(t('errors.passwordMismatch'));
                          } else {
                            setPasswordError('');
                          }
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder={t('password.confirmPasswordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                      >
                        {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{passwordError}</p>
                    </div>
                  )}

                  {newPassword && !passwordError && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600">
                        {t('password.strengthIndicator', { length: newPassword.length })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <FaTimes size={14} />
                <span>{t('actions.cancel')}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isPending ? (
                  <FaSync className="animate-spin" size={14} />
                ) : (
                  <FaSave size={14} />
                )}
                <span>{isPending ? t('actions.saving') : t('actions.saveChanges')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}