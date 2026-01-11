// app/[locale]/admin/audit-logs/audit-logs-page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Session } from "next-auth";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  translation_params?: any | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AuditLogsPageClientProps {
  locale: string;
  initialLogs: AuditLog[];
  initialTotalPages: number;
  initialTotalCount: number;
  session: Session | null;
}

interface Filters {
  action: string;
  entity_type: string;
  user_id: string;
  date_from: string;
  date_to: string;
  discount_actions: string;
}

export function AuditLogsPageClient({
  locale,
  initialLogs,
  initialTotalPages,
  initialTotalCount
}: AuditLogsPageClientProps) {
  useParams();
  const t = useTranslations('AuditLogsPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [filters, setFilters] = useState<Filters>({
    action: '',
    entity_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
    discount_actions: ''
  });
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);

  // Fetch users for filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users?simple=true');
        const result = await response.json();
        if (result.success) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const loadLogs = async (newPage = page, newFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(newFilters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
        setTotalPages(result.pagination.pages);
        setTotalCount(result.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    loadLogs(1, newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      action: '',
      entity_type: '',
      user_id: '',
      date_from: '',
      date_to: '',
      discount_actions: ''
    };
    setFilters(emptyFilters);
    setPage(1);
    loadLogs(1, emptyFilters);
  };

  const getTranslatedDescription = (log: AuditLog) => {

    if (log.description?.startsWith('audit.')) {
      try {
        const params = log.translation_params || {};

        const result = t(log.description as any, params as any);
        return result;
      } catch (error) {
        console.error('Translation error details:', {
          error,
          logId: log.id,
          description: log.description,
          params: log.translation_params
        });
        return log.description || 'No description';
      }
    }
    return log.description || 'No description';
  };

  // New function to translate entity type
  const getTranslatedEntityType = (entityType: string) => {
    if (entityType.startsWith('entity.')) {
      try {
        return t(entityType as any);
      } catch (error) {
        console.error('Entity type translation error:', { entityType, error });
        return entityType.replace('entity.', '').replace('_', ' ');
      }
    }
    return entityType; // Fallback to original if not a translation key
  };

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
        export: 'csv'
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (action.includes('DISCOUNT')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return '🆕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('LOGIN') || action.includes('USER_LOGOUT')) return '🔐';
    if (action.includes('DISCOUNT')) return '💰';
    return '📋';
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-8" dir={direction}>
      {/* Header */}
      <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('hero.title')}</h1>
            <p className="text-purple-100">{t('hero.subtitle')}</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={loading}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {t('exportButton')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{t('filters.title')}</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {t('filters.clearAll')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.action')}
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('filters.allActions')}</option>
              <option value="CREATE">{t('filters.actions.create')}</option>
              <option value="UPDATE">{t('filters.actions.update')}</option>
              <option value="DELETE">{t('filters.actions.delete')}</option>
              <option value="LOGIN">{t('filters.actions.login')}</option>
              <option value="APPLY_DISCOUNT">{t('filters.actions.apply_discount')}</option>
              <option value="UPDATE_DISCOUNT_PERMISSION">{t('filters.actions.update_discount_permission')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.discountActionsLabel')}
            </label>
            <select
              value={filters.discount_actions}
              onChange={(e) => handleFilterChange('discount_actions', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('filters.discount_actions.all')}</option>
              <option value="discount_only">{t('filters.discount_actions.discount_only')}</option>
              <option value="no_discount">{t('filters.discount_actions.no_discount')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.entityType')}
            </label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('filters.allEntities')}</option>
              <option value="User">{t('filters.entities.user')}</option>
              <option value="Patient">{t('filters.entities.patient')}</option>
              <option value="Test">{t('filters.entities.test')}</option>
              <option value="Doctor">{t('filters.entities.doctor')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.user')}
            </label>
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('filters.allUsers')}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.dateFrom')}
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.dateTo')}
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-800 font-medium">
              {t('resultsSummary', { total: totalCount })}
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 text-sm ml-2">
                ({t('filters.active')})
              </span>
            )}
          </div>
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 text-sm">{t('loading')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr >
                <th className={`px-6 py-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.user')}
                </th>
                <th className={`px-6 py-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.action')}
                </th>
                <th className={`px-6 py-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.entity')}
                </th>
                <th className={`px-6 py-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.description')}
                </th>
                <th className={`px-6 py-4 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('table.headers.timestamp')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">
                          {log.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{log.user.name}</div>
                        <div className="text-sm text-gray-500">{log.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getActionIcon(log.action)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {t(`actions.${log.action.toLowerCase()}`, { defaultValue: log.action.replace('_', ' ') })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{getTranslatedEntityType(log.entity_type)}</div>
                    {log.entity_id && (
                      <div className="text-xs text-gray-500 font-mono">ID: {log.entity_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs">
                      {getTranslatedDescription(log)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleDateString(locale)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString(locale)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {logs.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('emptyState.title')}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {hasActiveFilters ? t('emptyState.noResults') : t('emptyState.noLogs')}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  loadLogs(newPage);
                }}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('pagination.previous')}
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {t('pagination.pageInfo', { current: page, total: totalPages })}
                </span>
              </div>

              <button
                onClick={() => {
                  const newPage = Math.min(totalPages, page + 1);
                  setPage(newPage);
                  loadLogs(newPage);
                }}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}