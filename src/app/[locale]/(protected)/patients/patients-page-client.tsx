// app/[locale]/patients/patients-page-client.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PatientWithRelations } from '@/app/types';

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
  initialTotalCount,
}: PatientsPageClientProps) {

  const translateAgeUnit = (unit: string | null, value: number | null) => {
    if (!unit || !value) return '';

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
  const [isLoading, setIsLoading] = useState(false);

  const searchQuery = searchParams.get('search') || '';

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
                {searchQuery
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
        </div>
      </div>
    </div>
  );
}