// app/[locale]/test-categories/[id]/edit/edit-category-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestCategoryWithChildren } from '../../../../types';

interface EditTestCategoryClientProps {
  locale: string;
  initialCategory: TestCategoryWithChildren;
  initialCategories: TestCategoryWithChildren[];
  session: any;
}

export function EditTestCategoryClient({
  locale,
  initialCategory,
  initialCategories,
  session
}: EditTestCategoryClientProps) {
  const t = useTranslations('EditTestCategoryPage');
  const router = useRouter();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [category, setCategory] = useState<TestCategoryWithChildren>(initialCategory);
  const [categories] = useState<TestCategoryWithChildren[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/test-categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          parent_id: category.parent_id,
          is_active: category.is_active,
        }),
      });

      if (response.ok) {
        router.push(`/${locale}/test-categories`);
      } else {
        const error = await response.json();
        alert(t('messages.updateError', { error: error.error || t('messages.unknownError') }));
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      alert(t('messages.updateErrorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TestCategoryWithChildren, value: any) => {
    setCategory(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${locale}/test-categories`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            {t('actions.backToCategories')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
          <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
        </div>

        {/* Category Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('form.basicInfo.title')}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.nameLabel')} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={category.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.basicInfo.namePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.descriptionLabel')}
                  </label>
                  <textarea
                    id="description"
                    value={category.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.basicInfo.descriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.parentLabel')}
                  </label>
                  <select
                    id="parent"
                    value={category.parent_id || ''}
                    onChange={(e) => handleChange('parent_id', e.target.value || null)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('form.basicInfo.noParent')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={category.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    {t('form.basicInfo.activeLabel')}
                  </label>
                </div>
              </div>
            </div>

            {/* Category Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                {t('form.stats.title')}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('form.stats.subcategories')}:</span>
                  <span className="ml-2 font-medium text-gray-600">
                    {category.children?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('form.stats.tests')}:</span>
                  <span className="ml-2 font-medium text-gray-600">
                    {category.tests?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/${locale}/test-categories`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('actions.cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? t('actions.submitting') : t('actions.submit')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}