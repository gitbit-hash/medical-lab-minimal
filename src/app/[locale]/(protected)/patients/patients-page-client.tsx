// app/[locale]/patients/patients-page-client.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PatientWithRelations } from '@/app/types';
import { Pagination } from '@/app/components/pagination';

interface DoctorForFilter {
  id: string;
  name: string;
}

interface PatientsPageClientProps {
  locale: string;
  initialPatients: PatientWithRelations[];
  initialTotalPages: number;
  initialTotalCount: number;
  initialItemsPerPage: number;
  initialDoctors: DoctorForFilter[];
  session: any;
  initialSearchParams: {
    search: string;
    doctorId: string;
    dateFilter: string;
    sortBy: string;
    page: number;
  };
  expiringTestsCount?: number;
}

export function PatientsPageClient({
  locale,
  initialPatients,
  initialTotalPages,
  initialTotalCount,
  initialItemsPerPage,
  initialDoctors,
  session,
}: PatientsPageClientProps) {

  const translateAgeUnit = (unit: string | null, value: number | null) => {
    if (!unit || !value) return '';

    // Handle pluralization
    const isPlural = value !== 1;
    const unitKey = unit.toLowerCase();

    return t(`ageUnits.${unitKey}`);
  };

  const t = useTranslations('PatientsPage');
  const searchParams = useSearchParams();
  const router = useRouter();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // State for client-side operations
  const [patients, setPatients] = useState<PatientWithRelations[]>(initialPatients);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [uniqueDoctors] = useState(initialDoctors);
  const [isLoading, setIsLoading] = useState(false);

  const currentPage = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const doctorFilter = searchParams.get('doctorId') || 'all';
  const dateFilter = searchParams.get('dateFilter') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';
  const limitParam = searchParams.get('limit');

  // Function to fetch patients with current filters
  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const response = await fetch(`/api/patients?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatients(data.data);
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setItemsPerPage(Number(searchParams.get('limit')) || 25);
        } else {
          console.error('Failed to fetch patients:', data.error);
        }
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch patients when search params change
  useEffect(() => {
    fetchPatients();
  }, [searchParams]);

  // Sync itemsPerPage with URL limit parameter
  useEffect(() => {
    if (limitParam) {
      const newLimit = Number(limitParam);
      if (!isNaN(newLimit) && newLimit !== itemsPerPage) {
        setItemsPerPage(newLimit);
      }
    }
  }, [limitParam, itemsPerPage]);

  // Function to update URL parameters
  const updateURLParams = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === '' || value === 'all' || value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });

    // Reset to page 1 when changing filters (except page parameter)
    if (!params.page && Object.keys(params).some(k => ['search', 'doctorId', 'dateFilter', 'sort', 'limit'].includes(k))) {
      newParams.set('page', '1');
    }

    router.push(`/${locale}/patients?${newParams.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateURLParams({ page: newPage });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    updateURLParams({ limit: newItemsPerPage, page: 1 }); // Reset to page 1
  };

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    updateURLParams({ [name]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
            <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/patients/create`}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('actions.addNew')}
          </Link>
        </div>
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.searchLabel')}
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="form-input"
                  placeholder={t('filters.searchPlaceholder')}
                />
              </div>

              {/* Doctor Filter */}
              <div>
                <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.doctorLabel')}
                </label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={doctorFilter}
                  onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                  className="form-select"
                >
                  <option value="all">{t('filters.allDoctors')}</option>
                  {uniqueDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {t('filters.doctorPrefix')} {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.dateLabel')}
                </label>
                <select
                  id="dateFilter"
                  name="dateFilter"
                  value={dateFilter}
                  onChange={(e) => handleFilterChange('dateFilter', e.target.value)}
                  className="form-select"
                >
                  <option value="all">{t('filters.allTime')}</option>
                  <option value="today">{t('filters.today')}</option>
                  <option value="week">{t('filters.last7Days')}</option>
                  <option value="month">{t('filters.last30Days')}</option>
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
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="form-select"
                >
                  <option value="newest">{t('filters.sortNewest')}</option>
                  <option value="oldest">{t('filters.sortOldest')}</option>
                  <option value="name-asc">{t('filters.sortNameAsc')}</option>
                  <option value="name-desc">{t('filters.sortNameDesc')}</option>
                </select>
              </div>
            </div>

            {/* Results Count and Clear Filters */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {totalCount > 0 ? (
                  t('filters.resultsCount', {
                    start: ((currentPage - 1) * itemsPerPage) + 1,
                    end: Math.min(currentPage * itemsPerPage, totalCount),
                    total: totalCount
                  })
                ) : (
                  t('messages.noPatientsFound')
                )}
              </div>
              {(searchQuery || doctorFilter !== 'all' || dateFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/patients`)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {t('filters.clearFilters')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.name')}
                </th>
                <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.contact')}
                </th>
                <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.referringDoctors')}
                </th>
                <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.created')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/${locale}/patients/${patient.id}/tests`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900 block"
                    >
                      {patient.name}
                    </Link>
                    {patient.age_value && patient.age_unit && (
                      <div className="text-sm text-gray-500">
                        {t('table.age', {
                          value: patient.age_value,
                          unit: translateAgeUnit(patient.age_unit, patient.age_value)
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{patient.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {patient.doctors.map(pd => pd.doctor.name).join(', ') || 'None'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.created_at).toLocaleDateString(locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {patients.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">
                {searchQuery || doctorFilter !== 'all' || dateFilter !== 'all'
                  ? t('messages.noMatchingPatients')
                  : t('messages.noPatientsFound')
                }
              </div>
              {totalCount === 0 && (
                <Link
                  href={`/${locale}/patients/create`}
                  className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('actions.addNew')}
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}