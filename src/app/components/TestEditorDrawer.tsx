// app/[locale]/patients/[id]/tests/TestEditorDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { TestResultsForm } from './test-results-form'; // Keep import for non-CASA tests
import { TestTemplateWithCategoryAndParams, TestWithRelations } from '../types';
import { TestStatus, AndrologyTestType } from '@prisma/client';
import { ComprehensiveCASAForm } from './casa/ComprehensiveCASAForm';
import { Download, Eye, TestTube, Microscope } from 'lucide-react';

interface TestEditorDrawerProps {
  isOpen: boolean;
  onClose: (refresh?: boolean, updatedTest?: TestWithRelations) => void;
  test: TestWithRelations | null;
  locale: string;
  patientId: string;
}

export function TestEditorDrawer({
  isOpen,
  onClose,
  test,
  locale,
  patientId
}: TestEditorDrawerProps) {
  const [template, setTemplate] = useState<TestTemplateWithCategoryAndParams | null>(null);
  const [results, setResults] = useState<Record<string, any>>(
    (typeof test?.results === 'object' && test?.results !== null ? test.results : {}) as Record<string, any>
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allParametersFilled, setAllParametersFilled] = useState(false);
  const [casaAnalysis, setCasaAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'casa'>('general');

  // Check if this is a CASA test
  const isCasaTest = test?.andrology_test_type === 'CASA' ||
    test?.test_type?.toLowerCase().includes('casa') ||
    template?.andrology_test_type === 'CASA';

  useEffect(() => {
    if (!test) return;

    loadTemplate();

    // MODIFIED: If it's a CASA test, we only want the CASA tab
    if (isCasaTest) {
      loadCasaAnalysis();
      setActiveTab('casa');
    } else {
      // If not CASA, load template for general form
      setActiveTab('general');
    }
  }, [test]);

  useEffect(() => {
    if (test && test.results) {
      const currentResults = typeof test.results === 'object' && test.results !== null
        ? (test.results as Record<string, any>)
        : {};
      setResults(currentResults as Record<string, any>);
      setAllParametersFilled(false);

      // Only load template for general tests
      if (!isCasaTest) {
        loadTemplate();
      }
    }
  }, [test?.id]);

  async function loadTemplate() {
    try {
      const res = await fetch(`/api/test-templates?search=${encodeURIComponent(test!.test_type)}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data.data?.[0] || null);
      } else {
        setTemplate(null);
      }
    } catch (err) {
      console.error('Failed to load template:', err);
      setTemplate(null);
    }
  }

  async function loadCasaAnalysis() {
    try {
      const res = await fetch(`/api/tests/${test?.id}/casa-analysis`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCasaAnalysis(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load CASA analysis:', err);
    }
  }

  const checkAllParametersFilled = (currentResults: Record<string, any>, currentTemplate: TestTemplateWithCategoryAndParams | null) => {
    if (!currentTemplate || !currentTemplate.parameters || currentTemplate.parameters.length === 0) {
      return false;
    }
    return currentTemplate.parameters.every(parameter => {
      const paramCode = parameter.code || `param_${parameter.id}`;
      const value = currentResults[paramCode];
      return value !== null && value !== undefined && value !== '';
    });
  };

  const handleResultsChange = (newResults: Record<string, any>) => {
    setResults(newResults);
    setAllParametersFilled(checkAllParametersFilled(newResults, template));
  };

  const handleCasaSave = async (casaData: any) => {
    if (!test) return;

    setSaving(true);
    setError(null);

    try {
      // casaData structure from ComprehensiveCASAForm: { inputs: {...}, results: {...} }
      const inputsToSave = casaData.inputs || {};

      // First, save CASA analysis to CasaAnalysis table
      const casaResponse = await fetch(`/api/tests/${test.id}/casa-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casaData.results || casaData),
      });

      if (!casaResponse.ok) {
        const errorData = await casaResponse.json();
        throw new Error(errorData.error || `HTTP ${casaResponse.status}`);
      }

      const updatedCasaData = await casaResponse.json();

      // Then update the test status and save inputs to test.results
      const updateResponse = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: TestStatus.Completed,
          tested_at: new Date(),
          completed_at: new Date(),
          andrology_test_type: AndrologyTestType.CASA,
          results: {
            // Preserve existing results if any
            ...(typeof test.results === 'object' && test.results !== null ? test.results : {}),
            // Add CASA inputs for future editing
            casa_inputs: inputsToSave
          },
          // This ensures the test appears in the list as completed
          is_printed: false // Reset printed status if editing
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update test status');
      }

      const updatedTest = await updateResponse.json();

      // Refresh CASA analysis data
      await loadCasaAnalysis();

      // Pass the updated test back to the parent
      onClose(true, updatedTest.data || updatedTest);

    } catch (err) {
      console.error('Failed to save CASA analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to save CASA analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!test) return;

    setSaving(true);
    setError(null);

    try {
      let updatedStatus = test.status;
      let testedAt = test.tested_at;
      let completedAt = test.completed_at;

      if (test.status !== TestStatus.Completed && allParametersFilled) {
        updatedStatus = TestStatus.Completed;
        testedAt = new Date();
        completedAt = new Date();
      } else if (test.status === TestStatus.Completed) {
        testedAt = new Date();
      }

      const response = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          status: updatedStatus,
          tested_at: testedAt,
          completed_at: completedAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const updatedTestData = await response.json();

      const testWithUpdates: TestWithRelations = {
        ...test,
        results,
        status: updatedStatus,
        tested_at: testedAt ? new Date(testedAt) : null,
        completed_at: completedAt ? new Date(completedAt) : null,
        ...updatedTestData
      };

      onClose(true, testWithUpdates);
    } catch (err) {
      console.error('Failed to save test results:', err);
      setError(err instanceof Error ? err.message : 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && allParametersFilled) {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    if (template) {
      setAllParametersFilled(checkAllParametersFilled(results, template));
    }
  }, [template]);

  if (!test) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" as="div">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0">
        <div
          className="bg-white w-full h-full shadow-xl overflow-y-auto"
          onKeyDown={handleKeyDown}
        >
          <div className="flex justify-between items-center border-b p-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {test.status === TestStatus.Completed ? 'Edit Test Results' : 'Enter Test Results'} – {test.test_type}
                {test.status === TestStatus.Completed && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Completed Test - Editing Allowed)
                  </span>
                )}
              </h2>
              {isCasaTest && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Microscope className="w-4 h-4 mr-1" />
                  CASA Analysis
                </span>
              )}
            </div>
            <button
              onClick={() => onClose()}
              className="text-gray-500 hover:text-gray-800 font-medium text-lg"
            >
              ✕
            </button>
          </div>

          {/* MODIFIED: Only show tabs if it's a CASA test.
              For Non-CASA, we just show the general form directly.
          */}
          {isCasaTest ? (
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('casa')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center
                    ${activeTab === 'casa'
                      ? 'border-blue-500 text-blue-600 bg-blue-50/10'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Microscope className="w-4 h-4 mr-2" />
                  CASA Analysis
                </button>
              </nav>
            </div>
          ) : null}

          <div className="p-6">
            {/* Requirement Status for General Tests Only */}
            {!isCasaTest && template && (
              <div className={`mb-4 p-3 rounded-md ${allParametersFilled
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                }`}>
                <div className="flex items-center">
                  <span className="mr-2">
                    {allParametersFilled ? '✓' : '!'}
                  </span>
                  <span className="text-sm font-medium">
                    {allParametersFilled
                      ? test.status === TestStatus.Completed
                        ? 'All parameters are filled. You can save the edited results.'
                        : 'All parameters are filled. You can save and mark the test as completed.'
                      : `Please fill all ${template.parameters.length} parameters before saving.`
                    }
                  </span>
                </div>
                {!allParametersFilled && template.parameters.length > 0 && (
                  <div className="mt-1 text-xs">
                    Filled: {Object.keys(results).filter(key => results[key] !== null && results[key] !== undefined && results[key] !== '').length} of {template.parameters.length}
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {!template && !error && !isCasaTest ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-blue-600 text-sm">Loading template...</span>
              </div>
            ) : (
              <>
                {/* CASA Form - Always rendered if CASA test, no tab switching needed now */}
                {isCasaTest && (
                  <ComprehensiveCASAForm
                    testId={test.id}
                    initialData={casaAnalysis}
                    onSave={handleCasaSave}
                    testResults={results}
                    patientData={{
                      id: patientId,
                      name: test.patient?.name || 'Unknown Patient',
                      age_value: test.patient?.age_value,
                      age_unit: test.patient?.age_unit,
                      gender: test.patient?.gender,
                    }}
                  />
                )}

                {/* General Test Form - Only for Non-CASA tests */}
                {!isCasaTest && (
                  <>
                    {template ? (
                      <TestResultsForm
                        testTemplate={template}
                        initialResults={
                          typeof test.results === 'object' && test.results !== null ? test.results : {}
                        }
                        onResultsChange={handleResultsChange}
                      />
                    ) : (
                      <div className="p-4 bg-yellow-50 text-yellow-700 rounded">
                        No test template found for this test.
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm px-6 py-4 border-t">{error}</div>
          )}

          {/* Action Buttons for General Tests Only */}
          {!isCasaTest ? (
            <div className="flex justify-end border-t p-6 bg-gray-50 space-x-4">
              <button
                onClick={() => onClose(true)}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !allParametersFilled}
                className={`px-8 py-3 rounded-md transition font-medium ${allParametersFilled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } ${saving ? 'opacity-50' : ''}`}
              >
                {saving ? 'Saving...' : test.status === TestStatus.Completed ? 'Update Results' : 'Save & Mark as Completed'}
              </button>
            </div>
          ) : (
            // CASA form has its own internal save/close buttons in the footer area usually, 
            // but since we removed the tab wrapper, we can close via the X button.
            // If you want a close button at bottom, add it here.
            <div className="border-t p-6 bg-gray-50">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => onClose(true)}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}