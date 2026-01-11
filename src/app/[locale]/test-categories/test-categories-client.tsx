// app/[locale]/test-categories/test-categories-client.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestCategoryWithChildren } from '../../types';
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog';

interface TestCategoriesClientProps {
  locale: string;
  initialCategories: TestCategoryWithChildren[];
  session: any;
}

export function TestCategoriesClient({
  locale,
  initialCategories,
  session
}: TestCategoriesClientProps) {
  const t = useTranslations('TestCategoriesPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [categories, setCategories] = useState<TestCategoryWithChildren[]>(initialCategories);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (categoryId: string, categoryName: string) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(categoryToDelete.id);

    try {
      const response = await fetch(`/api/test-categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove category from local state
        const removeCategory = (cats: TestCategoryWithChildren[]): TestCategoryWithChildren[] => {
          return cats
            .filter(cat => cat.id !== categoryToDelete.id)
            .map(cat => ({
              ...cat,
              children: cat.children ? removeCategory(cat.children) : []
            }));
        };

        setCategories(removeCategory(categories));
        setShowDeleteDialog(false);
        setCategoryToDelete(null);
      } else {
        alert(t('messages.deleteError'));
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(t('messages.deleteError'));
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const renderCategoryTree = (categories: TestCategoryWithChildren[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className={`${level > 0 ? `ml-${level * 6}` : ''} mb-4`}>
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>
                {t('category.stats.tests', { count: category.tests?.length || 0 })}
              </span>
              <span>
                {t('category.stats.subcategories', { count: category.children?.length || 0 })}
              </span>
              <span className={category.is_active ? 'text-green-600' : 'text-red-600'}>
                {category.is_active ? t('category.status.active') : t('category.status.inactive')}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/${locale}/test-categories/${category.id}/edit`}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              {t('actions.edit')}
            </Link>
            <button
              onClick={() => handleDeleteClick(category.id, category.name)}
              disabled={isDeleting === category.id}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isDeleting === category.id ? t('actions.deleting') : t('actions.delete')}
            </button>
          </div>
        </div>

        {/* Render children */}
        {category.children && category.children.length > 0 && (
          <div className="mt-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: categoryToDelete?.name || '' })}
        confirmText={t('deleteDialog.confirmText')}
        isLoading={isDeleting === categoryToDelete?.id}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
            <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/${locale}/test-templates`}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('actions.manageTemplates')}
            </Link>
            <Link
              href={`/${locale}/test-categories/create`}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              {t('actions.addCategory')}
            </Link>
          </div>
        </div>

        {/* Categories Tree */}
        <div className="bg-white rounded-lg shadow p-6">
          {categories.length > 0 ? (
            renderCategoryTree(categories)
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">{t('messages.noCategoriesFound')}</div>
              <Link
                href={`/${locale}/test-categories/create`}
                className="inline-block bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('actions.createFirstCategory')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}