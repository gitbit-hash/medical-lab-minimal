'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestWithRelations, PatientWithRelations } from '@/app/types';
import { TestStatus } from '@prisma/client';
import { TestEditorDrawer } from '@/app/components/TestEditorDrawer';
import { PDFViewerModal } from '@/app/components/PDFViewerModal';
import { Dialog } from '@/app/components/Dialog';
import {
  IoPrint,
  IoPencilSharp,
  IoCreateOutline,
} from 'react-icons/io5';

interface PatientTestsClientProps {
  locale: string;
  initialPatient: PatientWithRelations;
  initialTests: TestWithRelations[];
  initialArchivedTestsCount: number;
  session: any;
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

export function PatientTestsClient({
  locale,
  initialPatient,
  initialTests,
}: PatientTestsClientProps) {
  const t = useTranslations('PatientTestsPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [patient] = useState<PatientWithRelations>(initialPatient);
  const [tests, setTests] = useState<TestWithRelations[]>(initialTests);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialog.isOpen) {
        // Close success dialog with Enter key
        if (e.key === 'Enter' && dialog.type === 'success' && dialog.onConfirm) {
          dialog.onConfirm();
        }
        // Close alert dialog with Enter key if it has onConfirm
        else if (e.key === 'Enter' && dialog.type === 'alert' && dialog.onConfirm) {
          dialog.onConfirm();
        }
        // Close dialog with Escape key
        else if (e.key === 'Escape' && dialog.onCancel) {
          dialog.onCancel();
        } else if (e.key === 'Escape') {
          closeDialog();
        }
      }
    };

    if (dialog.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog.isOpen, dialog.type, dialog.onConfirm, dialog.onCancel]);

  const patientPhone = patient.phone ? patient.phone : undefined;

  // Update the handleViewPrint function to check payment status more strictly
  const handleViewPrint = async (testId: string) => {
    // Get the test to check if it's CASA
    const test = tests.find(t => t.id === testId);

    if (!test) {
      showDialog(
        t('dialog.error'),
        t('messages.testNotFound'),
        'alert'
      );
      return;
    }
    // For non-CASA tests, use the existing PDF modal
    const newSet = new Set(selectedTests);
    newSet.add(testId);
    setSelectedTests(newSet);
    setPdfModalOpen(true);

  };

  const selectedTest = tests.find(t => t.id === selectedTestId) || null;

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

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const openDrawer = (testId: string) => {
    setSelectedTestId(testId);
    setDrawerOpen(true);
  };

  const closeDrawer = (refresh?: boolean, updatedTest?: TestWithRelations) => {
    setDrawerOpen(false);
    setSelectedTestId(null);

    if (updatedTest) {
      updateTestInState(updatedTest);
    } else if (refresh) {
      fetchTests();
    }
  };
  const fetchTests = async () => {
    try {
      const response = await fetch(`/api/patients/${patient.id}/tests/`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTests(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      showDialog(
        t('dialog.error'),
        t('messages.fetchError'),
        'alert'
      );
    }
  };

  const updateTestInState = (updatedTest: TestWithRelations) => {
    setTests(prevTests =>
      prevTests.map(test =>
        test.id === updatedTest.id ? updatedTest : test
      )
    );
  };

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

  const handleGenerateReport = () => {

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
      const test = tests.find(t => t.id === testId);
      return !test || !hasResults(test);
    });

    if (testsWithoutResults.length > 0) {
      showDialog(
        t('dialog.warning'),
        t('messages.someTestsNoResults', { count: testsWithoutResults.length }),
        'alert'
      );
      return;
    }

    // ========== NEW LOGIC: SEPARATE CASA AND REGULAR TESTS ==========
    const regularTestIds: string[] = [];

    Array.from(selectedTests).forEach(testId => {
      const test = tests.find(t => t.id === testId);

      // FIX: Check if test exists before proceeding
      if (!test) return;

      regularTestIds.push(testId);

    });

    // Case 4: Only Regular Tests Selected -> Open Regular PDF Modal
    setPdfModalOpen(true);
  };

  const hasResults = (test: TestWithRelations): boolean => {
    // Check for CASA analysis specifically
    const isCasaTest = test.andrology_test_type === 'CASA' ||
      test.test_type?.toLowerCase().includes('casa') ||
      test.test_template?.andrology_test_type === 'CASA';

    if (isCasaTest) {
      // For CASA tests, check if casa_analysis exists OR if results.casa_inputs exists
      const hasCasaAnalysis = test.casa_analysis !== null && test.casa_analysis !== undefined;

      // FIX: Wrap the chain in Boolean() to ensure strict boolean type
      const hasCasaInputs = Boolean(
        test.results &&
        typeof test.results === 'object' &&
        test.results !== null &&
        !Array.isArray(test.results) &&
        'casa_inputs' in (test.results as Record<string, any>)
      );

      return hasCasaAnalysis || hasCasaInputs;
    }

    // Original logic for non-CASA tests
    if (!test.results) return false;

    if (typeof test.results === 'object' && test.results !== null && !Array.isArray(test.results)) {
      const resultsObj = test.results as Record<string, any>;

      if (test.test_template?.parameters) {
        const templateParameters = test.test_template.parameters;

        return templateParameters.every(parameter => {
          const paramCode = parameter.code || `param_${parameter.id}`;
          const value = resultsObj[paramCode];
          return value !== null && value !== undefined && value !== '';
        });
      }

      return Object.values(resultsObj).some(value =>
        value !== null && value !== undefined && value !== ''
      );
    }

    return false;
  };

  // Check if test is eligible for selection (has results and is completed)
  const isSelectable = (test: TestWithRelations): boolean => {
    const isCompleted = test.status === TestStatus.Completed;

    // For CASA tests, check if they have casa_analysis or casa_inputs
    const isCasaTest = test.andrology_test_type === 'CASA' ||
      test.test_type?.toLowerCase().includes('casa');

    if (isCasaTest) {
      return isCompleted && Boolean(
        test.casa_analysis !== null ||
        (test.results && typeof test.results === 'object' &&
          test.results !== null && 'casa_inputs' in test.results)
      );
    }

    return isCompleted && hasResults(test);
  };

  // Check if test can be edited (not archived)
  const isEditable = (test: TestWithRelations): boolean => {
    return !test.is_printed;
  };

  const getStatusColor = (status: TestStatus) => {
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

  const getStatusText = (status: TestStatus) => {
    return t(`status.${status.toLowerCase()}`, { defaultValue: status });
  };

  // Calculate counts for the selection summary
  const testsWithResults = tests.filter(isSelectable).length;
  const totalTests = tests.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
        </div>
        <div className="mb-6">
          <Link
            href={`/${locale}/patients`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            {t('actions.backToPatients')}
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('hero.title', { name: patient.name })}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('hero.subtitle')}
              </p>
            </div>

          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTests.size > 0 && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('messages.selectedCount', { count: selectedTests.size })}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateReport}
                  className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 hover:cursor-pointer text-white rounded-lg flex items-center`}
                >
                  <IoPrint className="mr-2" />
                  {t('actions.printSelected')}
                </button>                <button
                  onClick={() => setSelectedTests(new Set())}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 hover:cursor-pointer"
                >
                  {t('actions.clearSelection')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  <input
                    ref={(input) => {
                      if (input) {
                        input.indeterminate =
                          selectedTests.size > 0 &&
                          selectedTests.size < testsWithResults;
                      }
                    }}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        const resultTests = tests.filter(isSelectable).map((t) => t.id);
                        setSelectedTests(new Set(resultTests));
                      } else {
                        setSelectedTests(new Set());
                      }
                    }}
                    checked={
                      testsWithResults > 0 &&
                      selectedTests.size === testsWithResults
                    }
                    title={t('table.selectAllTitle')}
                  />
                </th>
                <th className={`px-6 py-3 text-xs ${locale === 'ar' ? 'text-right' : 'text-left'} font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.testName')}
                </th>
                <th className={`px-6 py-3 text-xs ${locale === 'ar' ? 'text-right' : 'text-left'} font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.status')}
                </th>
                <th className={`px-6 py-3 text-xs ${locale === 'ar' ? 'text-right' : 'text-left'} font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.results')}
                </th>
                <th className={`px-6 py-3 text-xs ${locale === 'ar' ? 'text-right' : 'text-left'} font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.created')}
                </th>
                <th className={`px-6 py-3 text-xs ${locale === 'ar' ? 'text-right' : 'text-left'} font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => {
                const testHasResults = hasResults(test);
                const isSelectableTest = isSelectable(test);
                const isEditableTest = isEditable(test);
                const isSelected = selectedTests.has(test.id);

                return (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTestSelect(test.id)}
                        disabled={!isSelectableTest}
                        className={`h-4 w-4 rounded border-gray-300 focus:ring-blue-500 ${!isSelectableTest ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        title={
                          !isSelectableTest
                            ? t('table.noResultsTooltip')
                            : t('table.selectTooltip')
                        }
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {test.test_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex py-1 rounded-full text-xs font-medium ${getStatusColor(
                          test.status
                        )}`}
                      >
                        {getStatusText(test.status)}
                        {test.status === TestStatus.Completed && test.is_printed && (
                          <span className="ml-2 text-xs text-purple-600">(Printed)</span>
                        )}
                        {test.status === TestStatus.Completed && test.is_printed && test.is_archived && (
                          <span className="ml-2 text-xs text-purple-600">(Archived)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex py-1 rounded-full text-xs font-medium ${testHasResults
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {testHasResults
                          ? t('table.resultsAvailable')
                          : t('table.noResults')
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(test.created_at).toLocaleDateString(locale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center justify-start space-x-2">
                      {/* Input Results/Edit button */}
                      {isEditableTest && (
                        <button
                          onClick={() => openDrawer(test.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title={testHasResults ? t('actions.editResults') : t('actions.inputResults')}
                        >
                          {testHasResults ? (
                            <IoPencilSharp className="text-2xl inline" />
                          ) : (
                            <IoCreateOutline className="text-2xl inline" />
                          )}
                        </button>
                      )}

                      {/* View/Print button */}
                      {test.status === TestStatus.Completed && testHasResults && (
                        <button
                          onClick={() => {
                            handleViewPrint(test.id);
                          }}
                          className={`text-green-600 hover:text-green-900 cursor-pointer`}
                          title={t('actions.viewPrint')}
                        >
                          <IoPrint className="text-2xl inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selection Summary */}
        {tests.length > 0 && (
          <div className="mt-4 text-sm text-gray-700">
            {t('selection.summary', {
              selected: selectedTests.size,
              withResults: testsWithResults,
              total: totalTests
            })}
          </div>
        )}

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
          isDestructive={dialog.type === 'confirm' && dialog.title.toLowerCase().includes('archive')}
        />

        <TestEditorDrawer
          test={selectedTest}
          isOpen={drawerOpen}
          onClose={closeDrawer}
          locale={locale}
          patientId={patient.id}
        />

        {/* PDF Viewer Modal */}
        <PDFViewerModal
          isOpen={pdfModalOpen}
          onClose={() => {
            setPdfModalOpen(false);
            // After printing, automatically archive completed tests
            const completedTestIds = Array.from(selectedTests).filter(testId => {
              const test = tests.find(t => t.id === testId);
              return test?.status === TestStatus.Completed;
            });

          }}
          patientId={patient.id}
          testIds={Array.from(selectedTests)}
          patientPhone={patientPhone}
        />
      </div>
    </div>
  );
}