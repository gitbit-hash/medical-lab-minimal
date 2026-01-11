// app/[locale]/doctors/[id]/doctor-detail-page-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DeleteConfirmationDialog } from '../../../components/delete-confirmation-dialog';
import { Phone } from 'lucide-react'

interface DoctorDetailClientProps {
  locale: string;
  doctor: any; // You might want to create a proper type for this
}

export function DoctorDetailClient({ locale, doctor }: DoctorDetailClientProps) {
  const t = useTranslations('DoctorDetailPage');
  const router = useRouter();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const patientCount = doctor.patients?.length || 0;

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/${locale}/doctors`);
      } else {
        alert(t('messages.deleteError'));
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      alert(t('messages.deleteError'));
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: doctor.name })}
        confirmText={t('deleteDialog.confirmText')}
        isLoading={isDeleting}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${locale}/doctors`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← {t('actions.backToDoctors')}
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
              {doctor.specialization && (
                <p className="text-gray-600 mt-2 text-lg">{doctor.specialization}</p>
              )}
              <p className="text-gray-500 mt-1">
                {t('patientCount', { count: patientCount })}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/${locale}/doctors/${doctor.id}/edit`}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('actions.edit')}
              </Link>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? t('actions.deleting') : t('actions.delete')}
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('sections.contactInfo')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('contact.phone')}</h3>
              <p className="text-gray-900">{doctor.phone || t('contact.notProvided')}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('contact.email')}</h3>
              <p className="text-gray-900">{doctor.email || t('contact.notProvided')}</p>
            </div>

            {doctor.clinic_address && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{t('contact.address')}</h3>
                <p className="text-gray-900 whitespace-pre-line">{doctor.clinic_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Patients Section */}
        {patientCount > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('sections.patients')} ({patientCount})
            </h2>

            <div className="space-y-4">
              {doctor.patients
                .filter((patientRelation: any) => patientRelation.patient && !patientRelation.patient.is_deleted) // Additional safety check
                .map((patientRelation: any) => {
                  const patient = patientRelation.patient;
                  // Double-check patient exists
                  if (!patient) return null;

                  const testCount = patient.tests?.length || 0;

                  return (
                    <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            href={`/${locale}/patients/${patient.id}/tests`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-900"
                            onClick={(e) => {
                              // Optional: Add a check before navigating
                              if (patient.is_deleted) {
                                e.preventDefault();
                                alert('This patient has been deleted');
                              }
                            }}
                          >
                            {patient.name}
                          </Link>
                          {patient.age_value && patient.age_unit && (
                            <p className="text-gray-600 text-sm mt-1">
                              {patient.age_value} {patient.age_unit}
                            </p>
                          )}
                          <p className="text-gray-500 text-sm mt-1">
                            {t('patients.testCount', { count: testCount })}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(patient.created_at).toLocaleDateString(locale)}
                        </div>
                      </div>

                      {patient.phone && (
                        <p className="text-gray-600 text-sm mt-2">
                          <Phone className='w-5 h-5' /> {patient.phone}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}