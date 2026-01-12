'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestWithRelations, PatientWithRelations } from '../../../../types';
import { TestStatus } from '@prisma/client';
import { TestEditorDrawer } from '../../../../components/TestEditorDrawer';
import { PDFViewerModal } from '../../../../components/PDFViewerModal';
import { LabToLabModal } from '../../../../components/LabToLabModal';
import { Dialog } from '../../../../components/Dialog';
import {
  IoPrint,
  IoPencilSharp,
  IoCreateOutline,
  IoCashOutline,
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

interface ExternalLab {
  id: string;
  name: string;
  contact_number?: string;
  address?: string;
  email?: string;
}

export function PatientTestsClient({
  locale,
  initialPatient,
  initialTests,
  initialArchivedTestsCount,
  session
}: PatientTestsClientProps) {
  const t = useTranslations('PatientTestsPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [patient] = useState<PatientWithRelations>(initialPatient);
  const [tests, setTests] = useState<TestWithRelations[]>(initialTests);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [patientPaymentInfo, setPatientPaymentInfo] = useState<any | undefined>(undefined);
  const [amountToCollect, setAmountToCollect] = useState<number>(0);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labs, setLabs] = useState<ExternalLab[]>([]);
  const [currentTestForLab, setCurrentTestForLab] = useState<{
    testId: string;
    currentAssignment?: {
      labId: string;
      labName: string;
      price: number;
    };
  } | null>(null);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);

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

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(`/api/patients/${patient.id}/payment`);
        if (response.ok) {
          const data = await response.json();
          setPatientPaymentInfo(data.data);
          setAmountToCollect(data.data?.amount_due || 0); // Set the default to full amount due
        }
      } catch (error) {
        console.error('Failed to fetch payment info:', error);
      }
    };

    fetchPaymentInfo();
  }, [patient.id]);

  useEffect(() => {
    fetchLabs();
  }, []);

  const patientPhone = patient.phone ? patient.phone : undefined;

  const hasPaidInFull = patientPaymentInfo === undefined ?
    false : // Still loading, assume not paid
    patientPaymentInfo?.payment_status === 'Paid' || patientPaymentInfo?.amount_due === 0;

  const amountDue = patientPaymentInfo?.amount_due || 0;
  const amountPaid = patientPaymentInfo?.amount_paid || 0;

  // Function to handle payment collection
  const handleCollectPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const fullPaymentAmount = patientPaymentInfo?.amount_due || 0;
      const currentAmountPaid = patientPaymentInfo?.amount_paid || 0;
      const newAmountPaid = currentAmountPaid + fullPaymentAmount;
      const newAmountDue = 0;
      const newPaymentStatus = 'Paid';

      const response = await fetch(`/api/patients/${patient.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          payment_status: newPaymentStatus,
          payment_method: 'Cash',
          receipt_number: patientPaymentInfo?.receipt_number || `PAY-${Date.now()}`,
        }),
      });

      if (response.ok) {
        // Immediately update the state with the new values
        setPatientPaymentInfo({
          ...patientPaymentInfo,
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          payment_status: newPaymentStatus,
        });

        // Show success message
        showDialog(
          t('dialog.paymentSuccess'),
          t('dialog.paymentSuccessMessage', { amount: fullPaymentAmount.toFixed(2), currency: t('actions.currency') }),
          'success'
        );

        // Close modal
        setShowPaymentModal(false);

        // Optionally refresh tests if needed
        // fetchTests();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      showDialog(
        t('dialog.paymentFailed'),
        t('dialog.paymentFailedMessage', { error: error instanceof Error ? error.message : t('errors.unknown') }),
        'alert'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Update the handleViewPrint function to check payment status more strictly
  const handleViewPrint = async (testId: string) => {
    // Don't proceed if payment info is still loading
    if (patientPaymentInfo === undefined) {
      showDialog(
        t('dialog.paymentLoading'),
        t('dialog.paymentLoadingMessage'),
        'info'
      );
      return;
    }

    // Check payment status
    if (amountDue > 0 || !hasPaidInFull) {
      showDialog(
        t('dialog.warning'),
        t('messages.paymentRequired', { amount: amountDue }),
        'alert',
        {
          confirmText: t('actions.collectPayment'),
          onConfirm: () => setShowPaymentModal(true)
        }
      );
      return;
    }

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

  const fetchLabs = async () => {
    setIsLoadingLabs(true);
    try {
      const response = await fetch('/api/external-labs');
      if (response.ok) {
        const data = await response.json();
        setLabs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch labs:', error);
      showDialog(
        t('dialog.error'),
        t('dialog.failedToFetchLabs'),
        'alert'
      );
    } finally {
      setIsLoadingLabs(false);
    }
  };

  const handleAssignToLab = async (labId: string, price: number, testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/assign-external`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_lab_id: labId,
          outsourcing_cost: price
        })
      });

      if (response.ok) {
        const updatedTest = await response.json();
        updateTestInState(updatedTest.data);

        showDialog(
          t('dialog.success'),
          t('dialog.labAssignedSuccess'),
          'success'
        );
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign lab');
      }
    } catch (error) {
      console.error('Failed to assign lab:', error);
      showDialog(
        t('dialog.error'),
        error instanceof Error ? error.message : t('dialog.labAssignFailed'),
        'alert'
      );
    }
  };

  const handleRemoveAssignment = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}/assign-external`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const updatedTest = await response.json();
        updateTestInState(updatedTest.data);

        showDialog(
          t('dialog.success'),
          t('dialog.labAssignmentRemoved'),
          'success'
        );
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove lab assignment');
      }
    } catch (error) {
      console.error('Failed to remove lab assignment:', error);
      showDialog(
        t('dialog.error'),
        error instanceof Error ? error.message : t('dialog.labRemoveFailed'),
        'alert'
      );
    }
  };

  const handleAddNewLab = async (labData: Omit<ExternalLab, 'id'>) => {
    try {
      const response = await fetch('/api/external-labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add lab');
      }

      const data = await response.json();

      // Add new lab to the list and select it
      setLabs(prev => [...prev, data.data]);

      return data.data;
    } catch (error) {
      console.error('Failed to add lab:', error);
      throw error;
    }
  };

  const handleDeleteLab = async (labId: string) => {
    try {
      const response = await fetch(`/api/external-labs/${labId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Remove the lab from the labs list
        setLabs(prev => prev.filter(lab => lab.id !== labId));

        // If the deleted lab was selected in any test, we should update that test
        // But for now, we just remove from the list

        return; // Success
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete lab');
      }
    } catch (error) {
      console.error('Failed to delete lab:', error);
      throw error; // Let the modal handle the error
    }
  };

  const isCasaTest = (test: TestWithRelations): boolean => {
    return test.andrology_test_type === 'CASA' ||
      test.test_type?.toLowerCase().includes('casa') ||
      (test.test_template?.andrology_test_type === 'CASA');
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
      const response = await fetch(`/api/patients/${patient.id}/tests/filter?showArchived=${showArchived}`);
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
    // Check payment
    if (patientPaymentInfo?.payment_status !== 'Paid' && patientPaymentInfo?.amount_due > 0) {
      showDialog(
        t('dialog.warning'),
        t('messages.paymentRequired', { amount: patientPaymentInfo?.amount_due }),
        'alert',
        {
          confirmText: 'Collect Payment',
          onConfirm: () => setShowPaymentModal(true)
        }
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
    const casaTestIds: string[] = [];
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
    // For CASA tests, allow editing if not printed (archived) OR if it's completed but not printed
    const isCasaTest = test.andrology_test_type === 'CASA' ||
      test.test_type?.toLowerCase().includes('casa');

    if (isCasaTest) {
      // Allow editing if not printed, OR if completed but we want to allow re-editing
      return !test.is_printed ||
        (test.status === TestStatus.Completed && !test.is_printed);
    }

    // Original logic for non-CASA tests
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

  if (patientPaymentInfo === undefined) {
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
        {patientPaymentInfo !== undefined && !hasPaidInFull && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IoCashOutline className="h-5 w-5 text-yellow-600 mx-2" />
                <div>
                  <span className="font-semibold text-yellow-800">
                    {t('payment.required')}
                  </span>
                  <p className="text-yellow-700 text-sm">
                    {t('payment.requiredMessage', { amount: amountDue.toFixed(2), currency: t('actions.currency') })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
              >
                <IoCashOutline className="mx-2" />
                <span className="mr-2">
                  {t('actions.collectFullPayment')}
                </span>
              </button>
            </div>
          </div>
        )}
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
                  className={`px-4 py-2 ${hasPaidInFull ? 'bg-blue-500 hover:bg-blue-600  hover:cursor-pointer' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg flex items-center`}
                  disabled={!hasPaidInFull || selectedTests.size === 0}
                  title={!hasPaidInFull ? t('messages.paymentRequiredPrint') : undefined}
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
                          className={`${hasPaidInFull ? 'text-green-600 hover:text-green-900 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                          title={patientPaymentInfo === undefined ? t('messages.loadingPaymentInfo') : (hasPaidInFull ? t('actions.viewPrint') : t('messages.paymentRequiredPrint'))}
                          disabled={!hasPaidInFull || patientPaymentInfo === undefined}
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
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t('payment.collectFullPayment')}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Payment Info Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{t('payment.patient')}:</p>
                        <p className="font-semibold text-gray-700">{patient.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('payment.receiptNumber')}:</p>
                        <p className="font-semibold text-gray-700">{patientPaymentInfo?.receipt_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('payment.alreadyPaid')}:</p>
                        <p className="font-semibold text-green-600">
                          {`${t('payment.alreadyPaidValue', { currency: t('actions.currency'), amount: amountPaid.toFixed(2) })}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('payment.amountDue')}:</p>
                        <p className="font-semibold text-yellow-600">
                          {`${t('payment.alreadyPaidValue', { currency: t('actions.currency'), amount: amountDue.toFixed(2) })}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount to Collect (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('payment.amountToCollect')}
                    </label>
                    <div className="flex space-x-2">
                      {locale === 'ar' ?
                        (
                          <>
                            <div className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50">
                              <span className="font-semibold text-lg text-gray-700">
                                {amountDue.toFixed(2)}
                              </span>
                            </div>
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                              {t('actions.currency')}
                            </span>
                          </>
                        )
                        :
                        (
                          <>
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                              {t('actions.currency')}
                            </span>
                            <div className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50">
                              <span className="font-semibold text-lg text-gray-700">
                                {amountDue.toFixed(2)}
                              </span>
                            </div>
                          </>
                        )
                      }
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('payment.fullPaymentRequired')}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('payment.method')}
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="Cash"
                    >
                      <option value="Cash">{t('paymentMethods.cash')}</option>
                      <option value="Card">{t('paymentMethods.card')}</option>
                      <option value="Bank Transfer">{t('paymentMethods.bankTransfer')}</option>
                      <option value="Insurance">{t('paymentMethods.insurance')}</option>

                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      disabled={isProcessingPayment || amountDue <= 0}
                      onClick={() => {
                        setShowPaymentModal(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('payment.cancel')}
                    </button>
                    <button
                      onClick={handleCollectPayment}
                      disabled={isProcessingPayment || amountDue <= 0}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isProcessingPayment ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          `${isProcessingPayment ? t('payment.processing') : t('payment.collectAmount', { amount: amountDue.toFixed(2) })}`
                        </>
                      ) : (
                        `${t('actions.collectFullPayment', { currency: t('actions.currency'), amount: amountDue.toFixed(2) })}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {labModalOpen && currentTestForLab && (
          <LabToLabModal
            isOpen={labModalOpen}
            onClose={() => {
              setLabModalOpen(false);
              setCurrentTestForLab(null);
            }}
            onAssign={handleAssignToLab}
            onRemoveAssignment={handleRemoveAssignment}
            onDeleteLab={handleDeleteLab} // Add this
            onAddLab={handleAddNewLab}
            testId={currentTestForLab.testId}
            currentAssignment={currentTestForLab.currentAssignment}
            labs={labs}
            isLoadingLabs={isLoadingLabs}
            onRefreshLabs={fetchLabs}
            locale={locale}
            currencySymbol={t('actions.currency')}
          />
        )}
      </div>
    </div>
  );
}