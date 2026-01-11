'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PatientWithDetails } from '../../../../types';
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { evaluateTestResult, EvaluateResult } from '../../../../lib/utils/range-indicator';
import { IoPrint, IoDocumentTextOutline, IoBan, IoFlask, IoFlaskOutline, IoInformationCircle } from 'react-icons/io5';
import { ArrowLeftRight } from 'lucide-react';

import { PDFViewerModal } from '@/app/components/PDFViewerModal';
import { CasaPDFViewerModal } from '@/app/components/casa/CasaPDFViewerModal';

interface PatientViewClientProps {
  locale: string;
  patient: PatientWithDetails;
  session: any;
}

interface TestsTableFilters {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'alert' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const checkboxStyle = {
  container: "flex items-center justify-center",
  input: "h-4 w-4 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0",
  disabled: "opacity-50 cursor-not-allowed",
  enabled: "cursor-pointer"
};

export function PatientViewClient({ locale, patient, session }: PatientViewClientProps) {
  const t = useTranslations('PatientView');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const patientPhone = patient.phone ? patient.phone : undefined;

  // State for tests table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<TestsTableFilters>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  // CASA Modal State
  const [casaModalOpen, setCasaModalOpen] = useState(false);
  const [selectedCasaTestId, setSelectedCasaTestId] = useState<string | null>(null);

  // Bulk printing states
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfTestIds, setPdfTestIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const [patientPaymentInfo, setPatientPaymentInfo] = useState<any>(null);

  const [labAssignmentModalOpen, setLabAssignmentModalOpen] = useState(false);
  const [selectedLabAssignment, setSelectedLabAssignment] = useState<{
    testId: string;
    testName: string;
    labName: string;
    contactNumber?: string;
    address?: string;
    email?: string;
    price: number;
    outsourcingCost?: number;
  } | null>(null);

  useEffect(() => {
    const fetchPatientPaymentInfo = async () => {
      try {
        const response = await fetch(`/api/patients/${patient.id}/payment`);
        if (response.ok) {
          const data = await response.json();
          setPatientPaymentInfo(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch patient payment info:', error);
      }
    };

    fetchPatientPaymentInfo();
  }, [patient.id]);

  // Function to get range display exactly like in MultiTestReportPDF
  const getRangeDisplay = (parameter: any) => {
    if (parameter.normal_range_min !== null && parameter.normal_range_max !== null) {
      return {
        type: 'simple',
        value: `${parameter.normal_range_min} - ${parameter.normal_range_max}`
      };
    }

    if (parameter.normal_range_text) {
      if (parameter.normal_range_text.toLowerCase() === 'see report') {
        return {
          type: 'simple',
          value: 'See Report'
        };
      }

      if (parameter.normal_range_text.includes(',')) {
        const rangeArray = parameter.normal_range_text.split(',').map((item: string) => item.trim());
        return {
          type: 'array',
          value: rangeArray
        };
      }

      return {
        type: 'simple',
        value: parameter.normal_range_text
      };
    }

    // If no range data is available
    return {
      type: 'simple',
      value: 'Not Available'
    };
  };

  // Helper to check if test is CASA
  const isCasaTest = (test: any): boolean => {
    return test.andrology_test_type === 'CASA' ||
      test.test_type?.toLowerCase().includes('casa') ||
      (test.test_template?.andrology_test_type === 'CASA');
  };

  // Handle Print for both CASA and Regular tests
  const handlePrintSingleTest = (test: any) => {
    // Only print if test has results
    if (test.status !== 'Completed' || !hasResults(test)) {
      alert('Test must be completed and have results to print');
      return;
    }

    // CHANGED: Check if CASA and open Modal instead of downloading
    if (isCasaTest(test)) {
      setSelectedCasaTestId(test.id);
      setCasaModalOpen(true);
    } else {
      // Regular PDF Modal
      setPdfTestIds([test.id]);
      setPdfModalOpen(true);
    }
  };

  // Function to check if test has multiple parameters
  const hasMultipleParameters = (test: any): boolean => {
    return test.test_template?.parameters && test.test_template.parameters.length > 1;
  };

  // Function to render test results in a readable format
  const renderTestResults = (test: any) => {
    if (!test.results || typeof test.results !== 'object') {
      return (
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm flex items-center"><IoBan className="mr-1" /> Not Available</span>
        </div>
      );
    }

    const results = test.results as Record<string, any>;
    const entries = Object.entries(results);

    if (entries.length === 0) {
      return <span className="text-gray-500 text-sm">Not Available</span>;
    }

    // If test has template with parameters
    if (test.test_template?.parameters) {
      const firstParam = test.test_template.parameters[0];
      const paramCode = firstParam.code || firstParam.name || '';
      const resultValue = results[paramCode] || '';

      if (resultValue) {
        const evalRes = evaluateTestResult(resultValue, firstParam) as EvaluateResult;
        const { displayValue, indicator, isBold } = evalRes;

        // If multiple parameters, show view button
        if (hasMultipleParameters(test)) {
          return (
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => openResultsModal(test)}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  View All Results ({test.test_template.parameters.length})
                </button>
              </div>
              {/* Print Button */}
              {test.status === 'Completed' && hasResults(test) && !patientPaymentInfo?.amount_due && (
                <button
                  onClick={() => handlePrintSingleTest(test)}
                  className="text-green-400 hover:text-green-600 ml-2 hover:cursor-pointer"
                  title="Print test report"
                >
                  <IoPrint className="text-2xl" />
                </button>
              )}
              {test.status === 'Completed' && hasResults(test) && patientPaymentInfo?.amount_due > 0 && (
                <button
                  className="text-gray-400 ml-2 cursor-not-allowed"
                  title={t('messages.cannotPrintDueToPayment')}
                  disabled
                >
                  <IoPrint className="text-2xl" />
                </button>
              )}
            </div>
          );
        } else {
          // Single parameter - show directly with print button
          return (
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <div className={`font-medium ${isBold ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                  {displayValue} {firstParam.units || ''}
                </div>
                {indicator === 'up' && (
                  <span className="text-red-600 text-xs">↑</span>
                )}
                {indicator === 'down' && (
                  <span className="text-blue-600 text-xs">↓</span>
                )}
              </div>
              {/* Print Button */}
              {test.status === 'Completed' && hasResults(test) && !patientPaymentInfo?.amount_due && (
                <button
                  onClick={() => handlePrintSingleTest(test)}
                  className="text-green-400 hover:text-green-600 ml-2 hover:cursor-pointer"
                  title="Print test report"
                >
                  <IoPrint className="text-2xl" />
                </button>
              )}
              {test.status === 'Completed' && hasResults(test) && patientPaymentInfo?.amount_due > 0 && (
                <button
                  className="text-gray-400 ml-2 cursor-not-allowed"
                  title={t('messages.cannotPrintDueToPayment')}
                  disabled
                >
                  <IoPrint className="text-2xl" />
                </button>
              )}
            </div>
          );
        }
      }
    }

    // Fallback for tests without template parameters (FIX FOR [object Object])
    const firstEntry = entries[0];
    const key = firstEntry[0];
    const val = firstEntry[1];

    // FIX: Check if value is object, display friendly text instead of [object Object]
    const displayValue = typeof val === 'object' ? 'Results Available' : String(val);

    return (
      <div className="flex items-center justify-between">
        <div className="text-xs">
          <div className="font-medium text-gray-900 flex items-center">
            <IoDocumentTextOutline className="mr-1" />
            {displayValue}
          </div>
        </div>
        {/* Print Button */}
        {test.status === 'Completed' && hasResults(test) && !patientPaymentInfo?.amount_due && (
          <button
            onClick={() => handlePrintSingleTest(test)}
            className="text-green-400 hover:text-green-600 ml-2 hover:cursor-pointer"
            title="Print test report"
          >
            <IoPrint className="text-2xl" />
          </button>
        )}
        {test.status === 'Completed' && hasResults(test) && patientPaymentInfo?.amount_due > 0 && (
          <button
            className="text-gray-400 ml-2 cursor-not-allowed"
            title={t('messages.cannotPrintDueToPayment')}
            disabled
          >
            <IoPrint className="text-2xl" />
          </button>
        )}
      </div>
    );
  };

  // Check if test has any results
  const hasResults = (test: any): boolean => {
    if (test.casa_analysis) return true;

    if (!test.results) return false;

    if (typeof test.results === 'object' && test.results !== null) {
      return Object.values(test.results).some(value =>
        value !== null && value !== undefined && value !== ''
      );
    }

    return false;
  };

  // Check if test is eligible for bulk selection (has results and is completed)
  const isSelectable = (test: any): boolean => {
    return test.status === 'Completed' && hasResults(test);
  };

  const formatPrice = (amount: number) => {
    if (locale === 'ar') {
      return `${amount.toFixed(2)} ${t('labAssignment.currencySymbol')}`;
    } else {
      return `${t('labAssignment.currencySymbol')}${amount.toFixed(2)}`;
    }
  };
  // Handle test selection for bulk printing
  const handleTestSelect = (testId: string) => {
    setSelectedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  // Handle select all tests on current page
  const handleSelectAll = () => {
    const selectableTestsOnPage = paginatedTests.filter(isSelectable).map(t => t.id);

    if (selectableTestsOnPage.length === 0) return;

    const allSelected = selectableTestsOnPage.every(id => selectedTests.has(id));

    if (allSelected) {
      // Deselect all on page
      setSelectedTests(prev => {
        const newSet = new Set(prev);
        selectableTestsOnPage.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all selectable tests on page
      setSelectedTests(prev => {
        const newSet = new Set(prev);
        selectableTestsOnPage.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  // Handle bulk print
  const handleBulkPrint = () => {
    // Check if patient has amount due
    if (patientPaymentInfo?.amount_due) {
      showDialog(
        t('dialog.warning'),
        t('messages.cannotPrintDueToPayment'),
        'alert'
      );
      return;
    }

    if (selectedTests.size === 0) {
      showDialog(
        t('dialog.warning'),
        t('messages.noTestsSelected'),
        'alert'
      );
      return;
    }

    // Check if all selected tests have results
    const testsWithoutResults = Array.from(selectedTests).filter(testId => {
      const test = patient.tests.find(t => t.id === testId);
      return !test || !isSelectable(test);
    });

    if (testsWithoutResults.length > 0) {
      showDialog(
        t('dialog.warning'),
        t('messages.someTestsNoResults', { count: testsWithoutResults.length }),
        'alert'
      );
      return;
    }

    // NOTE: Bulk printing usually doesn't mix CASA and Regular.
    // If you select multiple CASA tests, this logic might need adjustment.
    // For now, we assume standard PDF bulk generation for Regular tests.
    // If CASA tests are included, we warn.
    const casaTestIds = Array.from(selectedTests).filter(id => isCasaTest(patient.tests.find(t => t.id === id)));

    if (casaTestIds.length > 0) {
      showDialog(
        t('dialog.warning'),
        'Bulk printing is not supported for CASA tests. Please select only one CASA test at a time.',
        'alert'
      );
      return;
    }

    setPdfTestIds(Array.from(selectedTests));
    setPdfModalOpen(true);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedTests(new Set());
  };

  // Show dialog
  const showDialog = (
    title: string,
    message: string,
    type: DialogState['type'] = 'alert',
    options?: {
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  };

  // Close dialog
  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Open results modal
  const openResultsModal = (test: any) => {
    setSelectedTest(test);
    setResultsModalOpen(true);
  };

  // Close results modal
  const closeResultsModal = () => {
    setResultsModalOpen(false);
    setSelectedTest(null);
  };

  const openLabAssignmentModal = (test: any) => {
    if (!test.external_lab_id || !test.external_lab) return;

    setSelectedLabAssignment({
      testId: test.id,
      testName: test.test_template?.name || test.test_type || 'Test',
      labName: test.external_lab.name,
      contactNumber: test.external_lab.contact_number || undefined,
      address: test.external_lab.address || undefined,
      email: test.external_lab.email || undefined,
      price: test.outsourcing_cost || 0,
      outsourcingCost: test.outsourcing_cost || 0
    });
    setLabAssignmentModalOpen(true);
  };

  const closeLabAssignmentModal = () => {
    setLabAssignmentModalOpen(false);
    setSelectedLabAssignment(null);
  };

  // Render detailed results in modal as a table - matching MultiTestReportPDF structure
  const renderDetailedResults = (test: any) => {
    if (!test.results || typeof test.results !== 'object') {
      return <div className="text-gray-500 text-center py-8">{t('modal.noResults')}</div>;
    }

    const results = test.results as Record<string, any>;

    // If test has template with parameters
    if (test.test_template?.parameters) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300`}>
                  {t('modal.table.testName')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300`}>
                  {t('modal.table.result')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300`}>
                  {t('modal.table.refRange')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('modal.table.unit')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {test.test_template.parameters.map((param: any, index: number) => {
                // Get the result value for this parameter
                // Try different possible keys: param.code, param.name, param.id
                let resultValue = '';

                if (param.code && results[param.code] !== undefined) {
                  resultValue = results[param.code];
                } else if (param.name && results[param.name] !== undefined) {
                  resultValue = results[param.name];
                } else if (results[`param_${param.id}`] !== undefined) {
                  resultValue = results[`param_${param.id}`];
                } else {
                  // Try to find by partial name match
                  const paramKey = Object.keys(results).find(key =>
                    key.toLowerCase().includes(param.name.toLowerCase()) ||
                    param.name.toLowerCase().includes(key.toLowerCase())
                  );
                  resultValue = paramKey ? results[paramKey] : '';
                }

                const evalRes = evaluateTestResult(resultValue, param) as EvaluateResult;
                const { displayValue, indicator, isBold } = evalRes;
                const rangeDisplay = getRangeDisplay(param);
                const isAlternateRow = index % 2 === 1;

                return (
                  <tr key={param.id} className={`${isAlternateRow ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                      {param.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-300">
                      <div className="flex items-center justify-center space-x-1">
                        <span className={`${isBold ? 'font-bold text-red-600' : 'text-gray-900'}`} dir="ltr">
                          {displayValue} {param.units || ''}
                        </span>
                        {indicator === 'up' && (
                          <span className="text-red-600 text-sm">↑</span>
                        )}
                        {indicator === 'down' && (
                          <span className="text-blue-600 text-sm">↓</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 border-r border-gray-300">
                      {rangeDisplay.type === 'array' ? (
                        <div className="text-left">
                          {rangeDisplay.value.map((item: string, idx: number) => (
                            <div key={idx} className="text-xs leading-tight">
                              {item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center">
                          {rangeDisplay.value}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      {param.units || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Fallback for tests without template parameters
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300`}>
                {t('modal.table.testName')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300`}>
                {t('modal.table.result')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300`}>
                {t('modal.table.refRange')}
              </th>
              <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                {t('modal.table.unit')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(results).map(([key, value], index) => {
              const isAlternateRow = index % 2 === 1;
              const displayVal = typeof value === 'object' ? 'Complex Data' : String(value);

              return (
                <tr key={key} className={`${isAlternateRow ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                    {key}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-center">
                    {displayVal}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 border-r border-gray-300 text-center">
                    {t('modal.table.notAvailable')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                    -
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Filter and paginate tests
  const filteredTests = useMemo(() => {
    return patient.tests.filter(test => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const testName = test.test_template?.name || test.test_type || '';
        const testCode = test.test_code || '';

        if (!testName.toLowerCase().includes(searchLower) &&
          !testCode.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && test.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const testDate = new Date(test.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (testDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const testDate = new Date(test.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (testDate > toDate) return false;
      }

      return true;
    });
  }, [patient.tests, filters]);

  // Paginate tests
  const paginatedTests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);

  // Calculate selectable tests count
  const selectableTestsCount = useMemo(() => {
    return filteredTests.filter(isSelectable).length;
  }, [filteredTests]);

  // Calculate selectable tests on current page
  const selectableTestsOnPage = useMemo(() => {
    return paginatedTests.filter(isSelectable);
  }, [paginatedTests]);

  // Handle filter changes
  const handleFilterChange = (key: keyof TestsTableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(patient.tests.map(test => test.status)));
    return statuses;
  }, [patient.tests]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTableDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale);
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestStatusText = (status: string) => {
    switch (status) {
      case 'Completed': return t('status.completed');
      case 'InProgress': return t('status.inProgress');
      case 'Pending': return t('status.pending');
      case 'Cancelled': return t('status.cancelled');
      default: return status;
    }
  };

  // If payment info is still loading, show a loading button
  if (patientPaymentInfo === null) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir={direction}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/${locale}/patients`}
              className="text-blue-500 hover:text-blue-700 inline-flex items-center"
            >
              <span className="mr-1">←</span>
              {t('actions.backToPatients')}
            </Link>
            <Link
              href={`/${locale}/patients/${patient.id}/tests`}
              className="text-blue-500 hover:text-blue-700 inline-flex items-center"
            >
              <span className="mr-1">←</span>
              {t('actions.backToPatientTests')}
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('title')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('subtitle')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-3">
              {(session.user?.can_edit_patients || session.user?.role === 'SuperAdmin') && (<Link
                href={`/${locale}/patients/${patient.id}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                {t('actions.editPatient')}
              </Link>)}
              {patientPaymentInfo?.amount_due > 0 ? (
                <div
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium inline-flex items-center relative group"
                  title={t('actions.cannotAddVisitTooltip')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('actions.addVisit')}
                </div>
              ) : (
                <Link
                  href={`/${locale}/patients/${patient.id}/add-visit`}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('actions.addVisit')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('personalInfo')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.name')}
                </label>
                <p className="text-lg font-medium text-gray-900">{patient.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.gender')}
                </label>
                <p className="text-gray-900">
                  {patient.gender === 'Male' && t('gender.male')}
                  {patient.gender === 'Female' && t('gender.female')}
                  {patient.gender === 'Other' && t('gender.other')}
                  {!patient.gender && 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.age')}
                </label>
                <p className="text-gray-900">
                  {patient.age_value && patient.age_unit
                    ? `${patient.age_value} ${t(`ageUnit.${patient.age_unit}`)}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.phone')}
                </label>
                <p className="text-gray-900">{patient.phone || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.email')}
                </label>
                <p className="text-gray-900">{patient.email || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patientId')}
                </label>
                <p className="text-sm text-gray-500 font-mono">{patient.id}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.address')}
                </label>
                <p className="text-gray-900">{patient.address || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('createdAt')}
                </label>
                <p className="text-gray-900">{formatDate(patient.created_at)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("financialInfo")}
              </h2>

              <div className={`grid ${patient.discount_amount && patient.discount_amount > 0 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
                {/* Financial Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('financial.totalAmount')}
                    </label>
                    <p className="text-lg font-medium text-gray-900">
                      {t('financial.totalAmountValue', { amount: patient.total_amount?.toFixed(2) || '0.00' })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('financial.amountPaid')}
                    </label>
                    <p className="text-lg font-medium text-green-600">
                      {t('financial.amountPaidValue', { amount: patient.amount_paid?.toFixed(2) || '0.00' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('financial.amountDue')}
                    </label>
                    <p className="text-lg font-medium text-red-600">
                      {t('financial.amountDueValue', { amount: patient.amount_due?.toFixed(2) || '0.00' })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('financial.paymentStatus')}
                    </label>
                    <span className={`inline-flex py-1 text-xs font-semibold rounded-full ${patient.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                      patient.payment_status === 'PartiallyPaid' ? 'bg-yellow-100 text-yellow-800' :
                        patient.payment_status === 'Insurance' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {patient.payment_status || 'Unpaid'}
                    </span>
                  </div>
                </div>

                {(patient.discount_amount || patient.discount_amount === 0) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('financial.discountApplied')}
                      </label>
                      <p className="text-lg font-medium text-purple-600">
                        {t('financial.discountAppliedValue', { amount: patient.discount_amount?.toFixed(2) || '0.00' })}
                        {patient.discount_type === 'Percentage' && patient.discount_percentage &&
                          ` (${patient.discount_percentage}%)`
                        }
                      </p>
                    </div>
                    {patient.discount_reason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('financial.discountReason')}
                        </label>
                        <p className="text-sm text-gray-600">{patient.discount_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('testsHistory')}
              </h2>
              <div className="text-sm text-gray-600">
                {t('table.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTests.length)} {t('table.to')} {Math.min(currentPage * itemsPerPage, filteredTests.length)} {t('table.of')} {filteredTests.length} {t('table.tests')}
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.search')}
                </label>
                <input
                  type="text"
                  id="search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('filters.searchPlaceholder')}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.status')}
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('filters.allStatuses')}</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {getTestStatusText(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.dateFrom')}
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('filters.dateTo')}
                </label>
                <input
                  type="date"
                  id="dateTo"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Items per page */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                  {t('itemsPerPage')}:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              {/* Bulk Selection Bar */}
              {selectedTests.size > 0 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBulkPrint}
                    className={`px-4 py-2 ${patientPaymentInfo?.amount_due ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg flex items-center`}
                    disabled={patientPaymentInfo?.amount_due}
                    title={patientPaymentInfo?.amount_due ? `${t('messages.cannotPrintDueToPayment')}` : "Print selected tests"}
                  >
                    <IoPrint className="mr-2" />
                    {t('actions.printSelected')}
                  </button>
                  <div className="flex items-center justify-center text-sm mx-3">
                    {patientPaymentInfo?.amount_due ? (
                      <span className="text-red-600">{t('messages.cannotPrintDueToPayment')}</span>
                    ) : (
                      <span className="text-gray-700">
                        {t(`messages.selectedForPrinting`, { count: selectedTests.size })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    {t('actions.clearSelection')}
                  </button>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={() => setFilters({ search: '', status: 'all', dateFrom: '', dateTo: '' })}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </div>

          {/* Tests Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className={checkboxStyle.container}>
                      <input
                        ref={(input) => {
                          if (input) {
                            const allSelectedOnPage = selectableTestsOnPage.length > 0 &&
                              selectableTestsOnPage.every(test => selectedTests.has(test.id));
                            input.indeterminate = selectedTests.size > 0 && !allSelectedOnPage;
                          }
                        }}
                        type="checkbox"
                        className={checkboxStyle.input}
                        onChange={handleSelectAll}
                        checked={
                          selectableTestsOnPage.length > 0 &&
                          selectableTestsOnPage.every(test => selectedTests.has(test.id))
                        }
                        disabled={selectableTestsOnPage.length === 0 || patientPaymentInfo?.amount_due}
                        title={patientPaymentInfo?.amount_due ? "Cannot select tests - patient has outstanding balance" : ""}
                      />
                    </div>
                  </th>
                  <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('table.createdDate')}
                  </th>
                  <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('table.testName')}
                  </th>
                  <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('table.status')}
                  </th>
                  <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('table.result')}
                  </th>
                  {/* Add this new column for lab assignment */}
                  <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('table.labAssignment')}
                  </th>
                  <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('table.fees')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTests.map((test) => {
                  const isSelectableTest = isSelectable(test);
                  const isSelected = selectedTests.has(test.id);
                  const hasLabAssignment = test.external_lab_id && test.external_lab;

                  return (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={checkboxStyle.container}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTestSelect(test.id)}
                            disabled={!isSelectableTest || patientPaymentInfo?.amount_due}
                            className={`${checkboxStyle.input} ${!isSelectableTest || patientPaymentInfo?.amount_due ? checkboxStyle.disabled : checkboxStyle.enabled
                              }`}
                            title={
                              patientPaymentInfo?.amount_due
                                ? "Cannot select - patient has outstanding balance"
                                : !isSelectableTest
                                  ? 'Cannot select test without results'
                                  : 'Select for bulk printing'
                            }
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTableDate(test.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {test.test_template?.name || test.test_type}
                        </div>
                        {test.test_code && (
                          <div className="text-sm text-gray-500">
                            {test.test_code}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTestStatusColor(test.status)}`}>
                          {getTestStatusText(test.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.status === 'Completed' && hasResults(test) ? (
                          renderTestResults(test)
                        ) : (
                          <span className="text-gray-500">{t('table.notAvailable')}</span>
                        )}
                      </td>
                      {/* Add this cell for lab assignment icon */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {hasLabAssignment ? (
                          <button
                            onClick={() => openLabAssignmentModal(test)}
                            className="text-purple-600 hover:text-purple-800 transition-colors "
                            title={`${t('labAssignment.assignedTo')} : ${test.external_lab?.name}\n${t('labAssignment.price')}: ${formatPrice(test.outsourcing_cost || 0)}`}
                          >
                            <ArrowLeftRight className="h-5 w-5" />
                          </button>
                        ) : (
                          <span className="text-gray-400">
                            <ArrowLeftRight className="h-5 w-5" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.test_template?.fees ? (
                          <span className="font-medium">{t('table.feesValue', { currency: t('financial.currency'), amount: test.test_template.fees })}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {paginatedTests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">
                  {filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo
                    ? t('noMatchingTests')
                    : t('noTests')
                  }
                </div>
                {patient.tests.length === 0 && (
                  <Link
                    href={`/${locale}/tests/create?patientId=${patient.id}`}
                    className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    {t('createFirstTest')}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('previous')}
                  </button>
                  <span className="text-sm text-gray-700">
                    {t('pageInfo', { current: currentPage, total: totalPages })}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('next')}
                  </button>
                </div>
                <div className="text-sm text-gray-700">
                  {t('table.showing')} {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTests.length)} {t('table.to')} {Math.min(currentPage * itemsPerPage, filteredTests.length)} {t('table.of')} {filteredTests.length} {t('table.tests')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      <Dialog open={resultsModalOpen} onClose={closeResultsModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-6xl w-full bg-white rounded-xl shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {selectedTest?.test_template?.name || selectedTest?.test_type} - {t('modal.results')}
              </DialogTitle>
              <button
                onClick={closeResultsModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {selectedTest && renderDetailedResults(selectedTest)}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeResultsModal}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* PDF Viewer Modal */}
      {pdfModalOpen && (
        <PDFViewerModal
          isOpen={pdfModalOpen}
          onClose={() => {
            setPdfModalOpen(false);
            setPdfTestIds([]);
          }}
          patientId={patient.id}
          testIds={pdfTestIds}
          patientPhone={patientPhone}
        />
      )}

      {/* CASA PDF Viewer Modal */}
      {casaModalOpen && selectedCasaTestId && (
        <CasaPDFViewerModal
          isOpen={casaModalOpen}
          onClose={() => {
            setCasaModalOpen(false);
            setSelectedCasaTestId(null);
          }}
          testId={selectedCasaTestId}
          patientPhone={patientPhone}
        />
      )}

      {/* Lab Assignment Modal */}
      <Dialog open={labAssignmentModalOpen} onClose={closeLabAssignmentModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <ArrowLeftRight className="h-6 w-6 text-purple-600 mr-2" />
                {t('labAssignment.title')}
              </DialogTitle>
              <button
                onClick={closeLabAssignmentModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {selectedLabAssignment && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedLabAssignment.testName}</h4>
                    <p className="text-sm text-gray-600">
                      {t('labAssignment.assignedToExternalLab')}
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {t('labAssignment.labName')}
                        </label>
                        <p className="font-medium text-gray-900">{selectedLabAssignment.labName}</p>
                      </div>

                      {selectedLabAssignment.contactNumber && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {t('labAssignment.contactNumber')}
                          </label>
                          <p className="text-gray-900">{selectedLabAssignment.contactNumber}</p>
                        </div>
                      )}

                      {selectedLabAssignment.email && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {t('labAssignment.email')}
                          </label>
                          <p className="text-gray-900">{selectedLabAssignment.email}</p>
                        </div>
                      )}

                      {selectedLabAssignment.address && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {t('labAssignment.address')}
                          </label>
                          <p className="text-gray-900 text-sm">{selectedLabAssignment.address}</p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center">
                          {selectedLabAssignment.outsourcingCost && (
                            <span className="ml-2 text-lg text-gray-600">
                              {t('labAssignment.outsourcingCost')}: {formatPrice(selectedLabAssignment.outsourcingCost)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <IoInformationCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                      <p className="text-sm text-blue-700">
                        {t('labAssignment.note')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeLabAssignmentModal}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('labAssignment.close')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}