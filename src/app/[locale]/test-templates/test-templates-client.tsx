// app/[locale]/test-templates/test-templates-client.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestTemplateForList } from '../../types';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog';
import {
  getDaysUntilExpiration,
  isExpiringSoon,
  isExpired,
  formatDaysRemaining
} from '../../lib/utils/date-utils';

interface TestTemplatesClientProps {
  locale: string;
  initialTemplates: TestTemplateForList[];
  session: any;
}

// Template Card Component
interface TemplateCardProps {
  template: TestTemplateForList;
  locale: string;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
  t: any;
  session: any;
}

function TemplateCard({ template, locale, onDelete, isDeleting, t, session }: TemplateCardProps) {
  const daysRemaining = getDaysUntilExpiration(template.expired_at);
  const expiringSoon = isExpiringSoon(template.expired_at, 15);
  const expired = isExpired(template.expired_at);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
      {/* Visual expiration indicator */}
      {expired && (
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500 rounded-l-lg"></div>
      )}
      {expiringSoon && !expired && (
        <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500 rounded-l-lg"></div>
      )}

      {/* Expiration Warning Banner */}
      {expiringSoon && !expired && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <span className="text-yellow-600 text-sm font-medium">
              ⚠️ {formatDaysRemaining(daysRemaining, t)}
            </span>
          </div>
        </div>
      )}

      {expired && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="text-red-600 text-sm font-medium">
              ❌ {formatDaysRemaining(daysRemaining, t)}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
            {expiringSoon && !expired && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⚠️
              </span>
            )}
            {expired && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                ❌
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{template.code}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {template.category.name}
            </span>
            {template.expired_at && !expiringSoon && !expired && (
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {formatDaysRemaining(daysRemaining, t)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-green-600 text-lg">
            {template.fees?.toFixed(2) || '0.00'}
          </div>
          {expired && (
            <div className="text-xs text-red-500 mt-1">
              {t('card.expiredStatus')}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {template.specimen && (
          <div className="flex items-center">
            <span className="w-5">🧪</span>
            <span>{t('card.specimen', { specimen: template.specimen })}</span>
          </div>
        )}
        {template.turnaround_time && (
          <div className="flex items-center">
            <span className="w-5">⏱️</span>
            <span>{t('card.turnaroundTime', { time: template.turnaround_time })}</span>
          </div>
        )}
        {(template.parameters || template._count?.parameters) && (
          <div className="flex items-center">
            <span className="w-5">📊</span>
            <span>{t('card.parameters', { count: template._count?.parameters ?? template.parameters?.length ?? 0 })}</span>
          </div>
        )}
        {template.expired_at && (
          <div className="flex items-center">
            <span className="w-5">📅</span>
            <span className={expired ? 'text-red-500' : expiringSoon ? 'text-yellow-500' : 'text-gray-600'}>
              {formatDaysRemaining(daysRemaining, t)}
            </span>
          </div>
        )}
      </div>

      {template.description && (
        <p className="text-sm text-gray-500 mb-4">{template.description}</p>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        {session?.user?.can_edit_test_templates && (
          <Link
            href={`/${locale}/test-templates/${template.id}/edit`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {t('actions.editTemplate')}
          </Link>
        )}

        <div className="flex items-center space-x-4">
          <div className={`text-xs ${template.is_active && !expired ? 'text-green-500' : 'text-red-500'}`}>
            {expired ? t('status.expired') :
              template.is_active ? t('status.active') : t('status.inactive')}
          </div>
          {session?.user?.can_delete_test_templates && (
            <button
              onClick={() => onDelete(template.id, template.name)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 hover:cursor-pointer"
            >
              {isDeleting ? t('actions.deleting') : t('actions.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TestTemplatesClient({
  locale,
  initialTemplates,
  session
}: TestTemplatesClientProps) {
  const t = useTranslations('TestTemplatesPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [templates, setTemplates] = useState<TestTemplateForList[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [expirationFilter, setExpirationFilter] = useState<'all' | 'expiring-soon' | 'expired' | 'active'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

  // Delete functionality (keep your existing delete handlers)
  const handleDeleteClick = (templateId: string, templateName: string) => {
    setTemplateToDelete({ id: templateId, name: templateName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    setIsDeleting(templateToDelete.id);
    try {
      const response = await fetch(`/api/test-templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        setShowDeleteDialog(false);
        setTemplateToDelete(null);
      } else {
        alert(t('messages.deleteError', { error: result.error }));
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert(t('messages.deleteErrorGeneric'));
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  // Filter templates based on search query and expiration status
  const filteredTemplates = templates.filter(template => {
    // Text search filter
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Expiration status filter
    switch (expirationFilter) {
      case 'expiring-soon':
        return isExpiringSoon(template.expired_at, 15) && !isExpired(template.expired_at);
      case 'expired':
        return isExpired(template.expired_at);
      case 'active':
        return !isExpired(template.expired_at) && template.is_active;
      case 'all':
      default:
        return true;
    }
  });

  // Count templates by status for summary
  const expiredCount = templates.filter(t => isExpired(t.expired_at)).length;
  const expiringSoonCount = templates.filter(t =>
    isExpiringSoon(t.expired_at, 15) && !isExpired(t.expired_at)
  ).length;
  const activeCount = templates.filter(t =>
    !isExpired(t.expired_at) && t.is_active
  ).length;

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: templateToDelete?.name || '' })}
        confirmText={t('deleteDialog.confirmText')}
        isLoading={isDeleting === templateToDelete?.id}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
            <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/${locale}/test-categories`}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              {t('actions.manageCategories')}
            </Link>
            {session?.user?.can_create_test_templates && (
              <Link
                href={`/${locale}/test-templates/create`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('actions.addNew')}
              </Link>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-500">{t('summary.total')}</div>
            <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-500">{t('summary.active')}</div>
            <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm font-medium text-gray-500">{t('summary.expiringSoon')}</div>
            <div className="text-2xl font-bold text-gray-900">{expiringSoonCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-sm font-medium text-gray-500">{t('summary.expired')}</div>
            <div className="text-2xl font-bold text-gray-900">{expiredCount}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                {t('search.label')}
              </label>
              <input
                type="text"
                id="search"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Expiration Filter */}
            <div>
              <label htmlFor="expirationFilter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('filters.expirationStatus')}
              </label>
              <select
                id="expirationFilter"
                value={expirationFilter}
                onChange={(e) => setExpirationFilter(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('filters.allTemplates')}</option>
                <option value="active">{t('filters.activeOnly')}</option>
                <option value="expiring-soon">{t('filters.expiringSoon')}</option>
                <option value="expired">{t('filters.expired')}</option>
              </select>
            </div>
          </div>

          {/* Results Count and Clear Filters */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {filteredTemplates.length > 0 ? (
                t('filters.resultsCount', { count: filteredTemplates.length })
              ) : (
                t('messages.noTemplatesFound')
              )}
            </div>
            {(searchQuery || expirationFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setExpirationFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {t('filters.clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredTemplates.length > itemsPerPage && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.previous' as any) || 'Previous'}
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.next' as any) || 'Next'}
            </button>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              locale={locale}
              onDelete={handleDeleteClick}
              isDeleting={isDeleting === template.id}
              t={t}
              session={session}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              {searchQuery || expirationFilter !== 'all'
                ? t('messages.noMatchingTemplates')
                : t('messages.noTemplatesFound')
              }
            </div>
            {session?.user?.can_create_test_templates && (
              <Link
                href={`/${locale}/test-templates/create`}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('actions.addNew')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
