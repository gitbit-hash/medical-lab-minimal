'use client';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { TestCategoryTree, TestTemplateSearchResult, TestTemplateWithCategoryAndParams } from '../types';
import { TiDelete } from "react-icons/ti";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { useTranslations } from 'next-intl';
import { useSession } from "next-auth/react";
import { updateTestTemplatePrice } from "@/app/actions/test-actions";

interface TestSelectionFormProps {
  selectedTests: TestTemplateSearchResult[];
  onTestsChange: (selectedTests: TestTemplateSearchResult[]) => void;
  onTotalChange?: (total: number) => void;
}

// Memoized components (keep the same as before)
const TestItem = memo(({ test, onAdd, t }: {
  test: any;
  onAdd: (test: any) => void;
  t: (key: string) => string;
}) => {
  const handleAdd = useCallback(() => {
    onAdd(test);
  }, [test, onAdd]);

  return (
    <div
      className="flex items-center justify-between py-2 px-4 hover:bg-blue-50 cursor-pointer border-l-2 border-blue-200 ml-4"
      onClick={handleAdd}
    >
      <div className="flex-1">
        <div className="font-medium text-gray-900">{test.name}</div>
        <div className="text-sm text-gray-600">
          {test.code} • {test.specimen} • {test.turnaround_time}
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-green-600">
          {(test.fees || 0).toFixed(2)}
        </div>
        <button
          type="button"
          className="text-blue-600 hover:text-blue-800 text-sm mt-1"
          onClick={handleAdd}
        >
          {t('addButton')}
        </button>
      </div>
    </div>
  );
});

TestItem.displayName = 'TestItem';

const SelectedTestItem = memo(({ test, onRemove, onUpdate }: {
  test: TestTemplateSearchResult;
  onRemove: (testId: string) => void;
  onUpdate: (testId: string, updates: Partial<TestTemplateSearchResult>) => void;
}) => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(test.fees || 0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrice(test.fees || 0);
  }, [test.fees]);

  const handleRemove = useCallback(() => {
    onRemove(test.id);
  }, [test.id, onRemove]);

  const handleSavePrice = async () => {
    setIsSaving(true);
    try {
      const result = await updateTestTemplatePrice(test.id, Number(price));
      if (result.success) {
        setIsEditing(false);
        onUpdate(test.id, { fees: Number(price) });
      } else {
        console.error("Failed to update price:", result.error);
        // Ideally show a toast here
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setPrice(test.fees || 0);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{test.name}</div>
        <div className="text-sm text-gray-600">
          {test.specimen}
        </div>
        {test.description && (
          <div className="text-sm text-red-600">
            {test.description}
          </div>
        )}
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-20 px-1 py-0.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-semibold text-green-600"
                min="0"
                step="0.01"
              />
              <button
                onClick={handleSavePrice}
                disabled={isSaving}
                className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
              >
                <FaCheck size={14} />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="font-semibold text-green-600 mr-2">
                {(test.fees || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <div className="text-red-400 hover:text-red-600 cursor-pointer mt-1">
          <TiDelete
            fontSize={30}
            onClick={handleRemove}
          />
        </div>
      </div>
    </div>
  );
});

SelectedTestItem.displayName = 'SelectedTestItem';

const SearchResultItem = memo(({ result, onAdd, t }: {
  result: TestTemplateSearchResult;
  onAdd: (test: any) => void;
  t: (key: string) => string;
}) => {
  const handleAdd = useCallback(() => {
    onAdd(result);
  }, [result, onAdd]);

  return (
    <div
      className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
      onClick={handleAdd}
    >
      <div className="flex-1">
        <div className="font-medium text-gray-900">{result.name}</div>
        <div className="text-sm text-gray-600">
          {result.code} • {result.category?.name || t('unknownCategory')} • {result.specimen}
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-green-600">${(result.fees || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-500">{t('addButton')} →</div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

// FIXED: Custom hook for search with proper useRef initialization
function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TestTemplateSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // FIXED: Initialize useRef with proper values
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsSearching(true);
      setSearchError('');

      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 15000);

      const res = await fetch(`/api/test-templates?search=${encodeURIComponent(query)}`, {
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }

      const results = result.data || [];
      setSearchResults(results);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setSearchError(`Search failed: ${errorMessage}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  const setQuery = useCallback((query: string) => {
    setSearchQuery(query);

    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
      setSearchError('');
      setIsSearching(false);
    }
  }, [debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchQuery,
    setQuery,
    searchResults,
    isSearching,
    searchError,
    setSearchError
  };
}

// FIXED: Main component with proper search hook usage
export const TestSelectionForm = memo(function TestSelectionForm({
  selectedTests = [],
  onTestsChange,
  onTotalChange
}: TestSelectionFormProps) {
  const t = useTranslations('TestSelectionForm');
  const [categories, setCategories] = useState<TestCategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<any[]>([]);

  // Use the search hook - FIXED: Now all state is managed by the hook
  const {
    searchQuery,
    setQuery,
    searchResults,
    isSearching,
    searchError,
    setSearchError
  } = useSearch();

  // Memoize selected tests to prevent unnecessary re-renders
  const safeSelectedTests = useMemo(() =>
    Array.from(new Map(selectedTests.map(t => [t.id, t])).values()),
    [selectedTests]
  );
  const originalTotalFees = useMemo(() =>
    safeSelectedTests.reduce((sum, t) => {
      const fees = typeof t.fees === 'number' ? t.fees : 0;
      return sum + (isNaN(fees) ? 0 : fees);
    }, 0),
    [safeSelectedTests]
  );
  // Memoize total calculation
  const totalFees = useMemo(() =>
    safeSelectedTests.reduce((sum, t) => {
      const fees = typeof t.fees === 'number' ? t.fees : 0;
      return sum + (isNaN(fees) ? 0 : fees);
    }, 0),
    [safeSelectedTests]
  );

  // Notify parent when total changes
  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(originalTotalFees);
    }
  }, [originalTotalFees, onTotalChange]);

  // Load categories with caching
  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await fetch('/api/test-categories', {
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutes
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      const cats = result.data || result;

      if (!Array.isArray(cats)) {
        throw new Error('Invalid categories data');
      }

      setCategories(cats);

      // Auto-expand categories
      const allIds = new Set<string>();
      const collectIds = (arr: TestCategoryTree[]) => {
        arr.forEach(c => {
          if (c.id && c.name) {
            allIds.add(c.id);
            if (c.children && c.children.length > 0) collectIds(c.children);
          }
        });
      };
      collectIds(cats);
      setExpandedCategories(new Set());

    } catch (err) {
      console.error('Failed to load categories:', err);
      setErrors(prev => [...prev, {
        type: 'CATEGORY_LOAD',
        message: 'Failed to load categories',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Memoized category toggle
  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Memoized add test function
  const addTest = useCallback((test: any) => {
    const testWithParams: TestTemplateWithCategoryAndParams = {
      ...test,
      parameters: test.parameters || [],
      category: test.category || {
        id: test.category_id || 'unknown-category',
        name: 'Unknown Category',
        created_at: new Date(),
        updated_at: new Date(),
        description: null,
        parent_id: null,
        is_active: true,
      },
      fees: typeof test.fees === 'number' ? test.fees : 0,
    };

    const updated = new Map(safeSelectedTests.map(t => [t.id, t]));
    updated.set(testWithParams.id, testWithParams);
    onTestsChange(Array.from(updated.values()));

    // Clear search
    setQuery('');
  }, [safeSelectedTests, onTestsChange, setQuery]);

  // Memoized remove test function
  const removeTest = useCallback((testId: string) => {
    const newList = safeSelectedTests.filter(t => t.id !== testId);
    onTestsChange(newList);
  }, [safeSelectedTests, onTestsChange]);

  // Memoized update test function
  const updateTest = useCallback((testId: string, updates: Partial<TestTemplateSearchResult>) => {
    const updatedList = safeSelectedTests.map(t => {
      if (t.id === testId) {
        return { ...t, ...updates };
      }
      return t;
    });
    onTestsChange(updatedList);
  }, [safeSelectedTests, onTestsChange]);

  // Optimized category tree rendering
  const renderCategoryTree = useCallback((cats: TestCategoryTree[], level = 0) => {
    if (!Array.isArray(cats) || cats.length === 0) {
      return null;
    }

    // Limit rendering to first 50 categories for performance
    const visibleCats = cats.slice(0, 50);

    return visibleCats.map(cat => {
      if (!cat.id || !cat.name) return null;

      const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
      const hasTests = Array.isArray(cat.tests) && cat.tests.length > 0;
      const isExpanded = expandedCategories.has(cat.id);

      return (
        <div key={cat.id} className="ml-4">
          <div
            className="flex items-center py-2 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleCategory(cat.id!)}
          >
            <div className="w-4 mr-2">
              {(hasChildren || hasTests) && (
                <span className="text-gray-500">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
            </div>
            <span className="font-medium text-gray-900">{cat.name}</span>
          </div>

          {isExpanded && (
            <>
              {/* Render tests for this category - limit to 20 for performance */}
              {hasTests && cat.tests!.slice(0, 20).map(test => (
                <TestItem
                  key={test.id}
                  test={test}
                  onAdd={addTest}
                  t={t}
                />
              ))}

              {/* Show more indicator if there are more tests */}
              {hasTests && cat.tests!.length > 20 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  ... and {cat.tests!.length - 20} more tests
                </div>
              )}

              {/* Render child categories */}
              {hasChildren && renderCategoryTree(cat.children!, level + 1)}
            </>
          )}
        </div>
      );
    }).filter(Boolean);
  }, [expandedCategories, toggleCategory, addTest, t]);

  // Virtualized search results for large datasets
  const renderSearchResults = useMemo(() => {
    if (searchResults.length === 0) return null;

    // Limit to 20 results for performance
    const visibleResults = searchResults.slice(0, 20);

    return (
      <div
        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {visibleResults.map(result => (
          <SearchResultItem
            key={result.id}
            result={result}
            onAdd={addTest}
            t={t}
          />
        ))}

        {/* Show more indicator */}
        {searchResults.length > 20 && (
          <div className="p-3 text-center text-sm text-gray-500 border-t">
            Showing 20 of {searchResults.length} results
          </div>
        )}
      </div>
    );
  }, [searchResults, addTest, t]);

  // Clear search results when clicking outside - FIXED: use searchResults from hook
  useEffect(() => {
    const handleClickOutside = () => {
      if (searchResults.length > 0) {
        // We can't directly setSearchResults here since it's managed by the hook
        // Instead, we clear the search query which will trigger the hook to clear results
        setQuery('');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [searchResults.length, setQuery]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-2"></div>
        <span className="ml-2 text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error.message}
            </div>
          ))}
        </div>
      )}

      {/* Optimized Search */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ direction: 'ltr', textAlign: 'left' }}
            dir="ltr"
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}

          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">
            {searchError}
          </div>
        )}

        {/* Search Results */}
        {renderSearchResults}

        {/* No Results Message */}
        {searchQuery && !isSearching && searchResults.length === 0 && !searchError && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            {t('noResults', { query: searchQuery })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Panel with virtualization */}
        <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">{t('categoriesTitle')}</h3>
          {categories.length > 0 ? (
            renderCategoryTree(categories)
          ) : (
            <div className="text-center text-gray-500 py-4">
              {t('noCategories')}
            </div>
          )}
        </div>

        {/* Selected Tests Panel */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t('selectedTestsTitle', { count: safeSelectedTests.length })}
          </h3>

          {safeSelectedTests.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded">
              {t('noTestsSelected')}
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {safeSelectedTests.map(test => (
                  <SelectedTestItem
                    key={test.id}
                    test={test}
                    onRemove={removeTest}
                    onUpdate={updateTest}
                  />
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{t('totalFees')}:</span>
                  <span className="text-xl font-bold text-green-600">{totalFees.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {safeSelectedTests.length === 0 && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
          ⚠️ {t('selectAtLeastOneTest')}
        </div>
      )}
    </div>
  );
});