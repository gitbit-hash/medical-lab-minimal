// app/[locale]/doctors/doctors-page-client.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DoctorForList } from '../../types';
import { Pagination } from '../../components/pagination';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog'; // Add this import
import { Phone, MapPinHouse, Mail } from 'lucide-react'

interface DoctorsPageClientProps {
  locale: string;
  initialDoctors: DoctorForList[];
  initialTotalPages: number;
  initialTotalCount: number;
  initialItemsPerPage: number;
  initialSpecializations: string[];
  session: any;
}

// Doctor Card Component
interface DoctorCardProps {
  doctor: DoctorForList;
  locale: string;
  onDelete: (id: string, name: string) => void; // Add onDelete prop
  isDeleting: string | null; // Add isDeleting prop
}

function DoctorCard({ doctor, locale, onDelete, isDeleting }: DoctorCardProps) {
  const t = useTranslations('DoctorsPage');
  const patientCount = doctor.patients ? doctor.patients.length : 0; // Add safe check

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
          {doctor.specialization && (
            <p className="text-gray-600 mt-1">{doctor.specialization}</p>
          )}
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
          {patientCount} {t('card.patient', { count: patientCount })}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {doctor.phone && (
          <div className="flex items-center">
            <Phone className='w-5 h-5 mr-2' />
            <span>{doctor.phone}</span>
          </div>
        )}
        {doctor.email && (
          <div className="flex items-center">
            <Mail className='w-5 h-5 mr-2' />
            <span className="truncate">{doctor.email}</span>
          </div>
        )}
        {doctor.clinic_address && (
          <div className="flex items-start">
            <MapPinHouse className='w-5 h-5 mr-2' />
            <span className="text-xs">{doctor.clinic_address}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <Link
          href={`/${locale}/doctors/${doctor.id}`}
          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          {t('card.viewDetails')}
        </Link>
        <div className="flex space-x-2">
          <Link
            href={`/${locale}/doctors/${doctor.id}/edit`}
            className="text-green-600 hover:text-green-900 text-sm"
          >
            {t('card.edit')}
          </Link>
          <button
            onClick={() => onDelete(doctor.id, doctor.name)}
            disabled={isDeleting === doctor.id}
            className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting === doctor.id ? t('card.deleting') : t('card.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DoctorsPageClient({
  locale,
  initialDoctors,
  initialTotalPages,
  initialTotalCount,
  initialItemsPerPage,
  initialSpecializations,
  session
}: DoctorsPageClientProps) {
  const t = useTranslations('DoctorsPage');
  const searchParams = useSearchParams();
  const router = useRouter(); // Add router for refresh after delete
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // State is now initialized with the correct type
  const [doctors, setDoctors] = useState<DoctorForList[]>(initialDoctors);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [uniqueSpecializations] = useState(initialSpecializations);

  // Add state for delete functionality
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<{ id: string; name: string } | null>(null);

  const currentPage = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const specializationFilter = searchParams.get('specialization') || 'all';
  const sortBy = searchParams.get('sort') || 'name-asc';

  // Delete functionality
  const handleDeleteClick = (doctorId: string, doctorName: string) => {
    setDoctorToDelete({ id: doctorId, name: doctorName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;

    setIsDeleting(doctorToDelete.id);
    try {
      const response = await fetch(`/api/doctors/${doctorToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove doctor from local state
        setDoctors(doctors.filter(d => d.id !== doctorToDelete.id));
        setTotalCount(prev => prev - 1);
        setShowDeleteDialog(false);
        setDoctorToDelete(null);

        // Refresh the page if we're on the last item of the current page
        if (doctors.length === 1 && currentPage > 1) {
          router.refresh(); // This will trigger a server-side refresh
        }
      } else {
        alert(t('messages.deleteError'));
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      alert(t('messages.deleteError'));
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDoctorToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      {/* Add Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: doctorToDelete?.name || '' })}
        confirmText={t('deleteDialog.confirmText')}
        isLoading={isDeleting === doctorToDelete?.id}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
            <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/doctors/create`}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('actions.addNew')}
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form method="GET" action={`/${locale}/doctors`} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.searchLabel')}
                </label>
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery}
                  className="form-input"
                  placeholder={t('filters.searchPlaceholder')}
                />
              </div>

              {/* Specialization Filter */}
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.specializationLabel')}
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  defaultValue={specializationFilter}
                  className="form-select"
                  onChange={(e) => {
                    const form = e.currentTarget.form;
                    if (form) form.submit();
                  }}
                >
                  <option value="all">{t('filters.allSpecializations')}</option>
                  {uniqueSpecializations.map(spec => (
                    <option key={spec} value={spec || ''}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.sortLabel')}
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sortBy}
                  className="form-select"
                  onChange={(e) => {
                    const form = e.currentTarget.form;
                    if (form) form.submit();
                  }}
                >
                  <option value="name-asc">{t('filters.sortNameAsc')}</option>
                  <option value="name-desc">{t('filters.sortNameDesc')}</option>
                  <option value="patients-desc">{t('filters.sortPatientsDesc')}</option>
                  <option value="patients-asc">{t('filters.sortPatientsAsc')}</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              locale={locale}
              onDelete={handleDeleteClick}
              isDeleting={isDeleting}
            />
          ))}
        </div>

        {doctors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {searchQuery || specializationFilter !== 'all'
                ? t('messages.noMatchingDoctors')
                : t('messages.noDoctorsFound')
              }
            </div>
            {totalCount === 0 && (
              <Link
                href={`/${locale}/doctors/create`}
                className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('actions.addFirstDoctor')}
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}