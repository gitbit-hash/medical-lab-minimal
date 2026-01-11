// app/[locale]/patients/[id]/patient-detail-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestStatus } from '@prisma/client';
import { PatientWithRelations, TestWithDoctor } from '../../../types';
import { DeleteConfirmationDialog } from '../../../components/delete-confirmation-dialog';

interface PatientDetailClientProps {
  locale: string;
  initialPatient: PatientWithRelations;
  session: any;
}

export function PatientDetailClient({
  locale,
  initialPatient,
  session
}: PatientDetailClientProps) {
  const router = useRouter();
  const t = useTranslations('PatientDetailPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [patient] = useState<PatientWithRelations>(initialPatient);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!patient) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to patients list
        router.push(`/${locale}/patients`);
      } else {
        alert(t('messages.deleteError'));
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
      alert(t('messages.deleteError'));
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to get status classes
  const getStatusClasses = (status: TestStatus) => {
    switch (status) {
      case TestStatus.Completed:
        return 'bg-green-100 text-green-800';
      case TestStatus.InProgress:
        return 'bg-yellow-100 text-yellow-800';
      case TestStatus.Pending:
        return 'bg-gray-100 text-gray-800';
      case TestStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format status for display
  const formatStatus = (status: TestStatus) => {
    return t(`status.${status.toLowerCase()}`, { defaultValue: status });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: patient.name })}
        confirmText={t('deleteDialog.confirmText')}
        isLoading={isDeleting}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${locale}/patients`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            {t('actions.backToPatients')}
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
            </div>
            <div className="flex space-x-3">
              {(session.user?.can_edit_patients || session.user?.role === 'SuperAdmin') && (<Link
                href={`/${locale}/patients/${patient.id}/edit`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('actions.editPatient')}
              </Link>)}
              <button
                onClick={handleDeleteClick}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? t('actions.deleting') : t('actions.deletePatient')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('basicInfo.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('basicInfo.fullName')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{patient.name}</p>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('basicInfo.gender')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {t(`basicInfo.gender${patient.gender}`)}
                  </p>
                </div>

                {patient.age_value && patient.age_unit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('basicInfo.age')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.age_value} {t(`basicInfo.ageUnit.${patient.age_unit}`)}
                    </p>
                  </div>
                )}

                {patient.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('basicInfo.phone')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{patient.phone}</p>
                  </div>
                )}

                {patient.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('basicInfo.email')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{patient.email}</p>
                  </div>
                )}

                {patient.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('basicInfo.address')}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{patient.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tests Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('tests.title')}
                </h2>
                <Link
                  href={`/${locale}/patients/${patient.id}/tests`}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  {t('tests.manageTests')}
                </Link>
              </div>

              {patient.tests.length > 0 ? (
                <div className="space-y-3">
                  {patient.tests.map((test: TestWithDoctor) => (
                    <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{test.test_type}</h3>
                          {test.test_code && (
                            <p className="text-sm text-gray-500">
                              {t('tests.code', { code: test.test_code })}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(test.status)}`}>
                          {formatStatus(test.status)}
                        </span>
                      </div>
                      {test.doctor && (
                        <p className="text-sm text-gray-600 mt-2">
                          {t('tests.referredBy', { doctor: test.doctor.name })}
                        </p>
                      )}
                      {test.tested_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          {t('tests.testedOn', { date: new Date(test.tested_at).toLocaleDateString(locale) })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">{t('tests.noTests')}</p>
                  <Link
                    href={`/${locale}/tests/create?patientId=${patient.id}`}
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    {t('tests.addFirstTest')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Referring Doctors */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('doctors.title')}
              </h2>
              {patient.doctors.length > 0 ? (
                <div className="space-y-3">
                  {patient.doctors.map((pd) => (
                    <div key={pd.id} className="border border-gray-200 rounded-lg p-3">
                      <h3 className="font-medium text-gray-900">{pd.doctor.name}</h3>
                      {pd.doctor.specialization && (
                        <p className="text-sm text-gray-600">{pd.doctor.specialization}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {t('doctors.referredSince', { date: new Date(pd.referred_at).toLocaleDateString(locale) })}
                      </p>
                      {pd.is_primary && (
                        <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {t('doctors.primary')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">{t('doctors.noDoctors')}</p>
                  {(session.user?.can_edit_patients || session.user?.role === 'SuperAdmin') && (<Link
                    href={`/${locale}/patients/${patient.id}/edit`}
                    className="inline-block text-blue-500 hover:text-blue-700 text-sm"
                  >
                    {t('doctors.addDoctors')}
                  </Link>)}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('quickActions.title')}
              </h2>
              <div className="space-y-3">
                <Link
                  href={`/${locale}/patients/${patient.id}/tests`}
                  className="block w-full text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('quickActions.viewAllTests')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}