// app/[locale]/test-templates/[id]/edit/edit-template-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestTemplateWithCategoryAndParams, TestCategoryBase, TestParameter } from '../../../../types';
import { formatDateForInput, parseInputDate } from '../../../../lib/utils/date-utils';
import { PermissionBadge } from '../../../../components/PermissionBadge'

interface EditTestTemplateClientProps {
  locale: string;
  initialTemplate: TestTemplateWithCategoryAndParams;
  initialCategories: TestCategoryBase[];
  session: any;
}

interface Parameter extends Omit<TestParameter, 'id' | 'test_template_id' | 'created_at' | 'updated_at'> {
  id?: string;
}

// Create a form-specific interface
interface TemplateFormData {
  name: string;
  code: string;
  category_id: string;
  description: string;
  specimen: string;
  container: string;
  volume: string;
  storage: string;
  methodology: string;
  turnaround_time: string;
  fees: number | null;
  is_active: boolean;
  expired_at: string;
}

export function EditTestTemplateClient({
  locale,
  initialTemplate,
  initialCategories,
  session
}: EditTestTemplateClientProps) {
  const t = useTranslations('EditTestTemplatePage');
  const router = useRouter();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [categories] = useState<TestCategoryBase[]>(initialCategories);
  const [isSaving, setIsSaving] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>(
    initialTemplate.parameters?.map(param => ({
      id: param.id,
      name: param.name,
      code: param.code,
      units: param.units || '',
      normal_range_min: param.normal_range_min,
      normal_range_max: param.normal_range_max,
      normal_range_text: param.normal_range_text || '',
      default_value: param.default_value || '',
      is_critical: param.is_critical,
      sort_order: param.sort_order
    })) || []
  );

  // Initialize form data with proper type conversion
  const [formData, setFormData] = useState<TemplateFormData>({
    name: initialTemplate.name,
    code: initialTemplate.code,
    category_id: initialTemplate.category_id,
    description: initialTemplate.description || '',
    specimen: initialTemplate.specimen || '',
    container: initialTemplate.container || '',
    volume: initialTemplate.volume || '',
    storage: initialTemplate.storage || '',
    methodology: initialTemplate.methodology || '',
    turnaround_time: initialTemplate.turnaround_time || '',
    fees: initialTemplate.fees ?? null,
    is_active: initialTemplate.is_active,
    expired_at: formatDateForInput(initialTemplate.expired_at)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/test-templates/${initialTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expired_at: formData.expired_at ? parseInputDate(formData.expired_at) : null,
          parameters: parameters,
        }),
      });

      if (response.ok) {
        router.push(`/${locale}/test-templates`);
      } else {
        const error = await response.json();
        alert(t('messages.updateError', { error: error.error || t('messages.unknownError') }));
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      alert(t('messages.updateErrorGeneric'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleParameterChange = (index: number, field: keyof Parameter, value: any) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = {
      ...updatedParameters[index],
      [field]: field === 'normal_range_min' || field === 'normal_range_max' || field === 'sort_order'
        ? (value !== '' && value !== null ? parseFloat(value) : null)
        : value
    };
    setParameters(updatedParameters);
  };

  const addParameter = () => {
    setParameters(prev => [...prev, {
      name: '',
      code: '',
      units: '',
      normal_range_min: null,
      normal_range_max: null,
      normal_range_text: '',
      default_value: '', // Add this
      is_critical: false,
      sort_order: prev.length
    }]);
  };

  const removeParameter = (index: number) => {
    setParameters(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={direction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${locale}/test-templates`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            {t('actions.backToTemplates')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
          <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
        </div>

        {/* Template Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('form.basicInfo.title')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.nameLabel')} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.codeLabel')} *
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => handleFormChange('code', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.categoryLabel')} *
                  </label>
                  <select
                    id="category_id"
                    required
                    value={formData.category_id}
                    onChange={(e) => handleFormChange('category_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('form.basicInfo.selectCategory')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.descriptionLabel')}
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Test Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('form.testDetails.title')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-wrap gap-1 mt-2">
                  <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.feesLabel')}
                  </label>
                  <PermissionBadge hasPermission={session?.user.can_edit_fees || session.user?.role === 'SuperAdmin'} label="Edit Fees" />
                  <input
                    id="fees"
                    type="number"
                    step="0.01"
                    value={formData.fees || ''}
                    onChange={(e) => handleFormChange('fees', parseFloat(e.target.value))}
                    disabled={!session?.user?.can_edit_fees && !(session.user?.role === 'SuperAdmin')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="specimen" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.specimenLabel')}
                  </label>
                  <input
                    id="specimen"
                    type="text"
                    value={formData.specimen}
                    onChange={(e) => handleFormChange('specimen', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="container" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.containerLabel')}
                  </label>
                  <input
                    id="container"
                    type="text"
                    value={formData.container}
                    onChange={(e) => handleFormChange('container', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.volumeLabel')}
                  </label>
                  <input
                    id="volume"
                    type="text"
                    value={formData.volume}
                    onChange={(e) => handleFormChange('volume', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.storageLabel')}
                  </label>
                  <input
                    id="storage"
                    type="text"
                    value={formData.storage}
                    onChange={(e) => handleFormChange('storage', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="turnaround_time" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.turnaroundTimeLabel')}
                  </label>
                  <input
                    id="turnaround_time"
                    type="text"
                    value={formData.turnaround_time}
                    onChange={(e) => handleFormChange('turnaround_time', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.methodologyLabel')}
                  </label>
                  <input
                    id="methodology"
                    type="text"
                    value={formData.methodology}
                    onChange={(e) => handleFormChange('methodology', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Expiration Date Field */}
                <div>
                  <label htmlFor="expired_at" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.expirationDateLabel')}
                  </label>
                  <input
                    id="expired_at"
                    type="date"
                    value={formData.expired_at}
                    onChange={(e) => handleFormChange('expired_at', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('form.testDetails.expirationDateHelp')}
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    {t('form.testDetails.activeLabel')}
                  </label>
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('form.parameters.title')}
                </h2>
                <button
                  type="button"
                  onClick={addParameter}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  {t('form.parameters.addButton')}
                </button>
              </div>

              {parameters.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">{t('form.parameters.noParameters')}</p>
                  <button
                    type="button"
                    onClick={addParameter}
                    className="mt-2 text-blue-500 hover:text-blue-700"
                  >
                    {t('form.parameters.addFirstParameter')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {parameters.map((param, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">
                          {t('form.parameters.parameterNumber', { number: index + 1 })}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeParameter(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          {t('form.parameters.removeButton')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.nameLabel')} *
                          </label>
                          <input
                            type="text"
                            required
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.codeLabel')} *
                          </label>
                          <input
                            type="text"
                            required
                            value={param.code}
                            onChange={(e) => handleParameterChange(index, 'code', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.unitsLabel')}
                          </label>
                          <input
                            type="text"
                            value={param.units || ''}
                            onChange={(e) => handleParameterChange(index, 'units', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.defaultValueLabel')}
                          </label>
                          <input
                            type="text"
                            value={param.default_value || ''}
                            onChange={(e) => handleParameterChange(index, 'default_value', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('form.parameters.defaultValuePlaceholder')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.sortOrderLabel')}
                          </label>
                          <input
                            type="number"
                            value={param.sort_order || index}
                            onChange={(e) => handleParameterChange(index, 'sort_order', parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.normalRangeMinLabel')}
                          </label>
                          <PermissionBadge hasPermission={session?.user.can_edit_reference_ranges || session?.user.role === 'SuperAdmin'} label="Edit Ranges" />                          <input
                            type="number"
                            step="any"
                            value={param.normal_range_min ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                handleParameterChange(index, 'normal_range_min', null);
                              } else {
                                const numValue = parseFloat(value);
                                // Check if it's a valid number (including 0)
                                handleParameterChange(index, 'normal_range_min', isNaN(numValue) ? null : numValue);
                              }
                            }}
                            disabled={!session?.user?.can_edit_reference_ranges && !(session.user?.role === 'SuperAdmin')}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.normalRangeMaxLabel')}
                          </label>
                          <PermissionBadge hasPermission={session?.user.can_edit_reference_ranges || session?.user.role === 'SuperAdmin'} label="Edit Ranges" />                          <input
                            type="number"
                            step="any"
                            value={param.normal_range_max ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                handleParameterChange(index, 'normal_range_max', null);
                              } else {
                                const numValue = parseFloat(value);
                                handleParameterChange(index, 'normal_range_max', isNaN(numValue) ? null : numValue);
                              }
                            }}
                            disabled={!session?.user?.can_edit_reference_ranges && !(session.user?.role === 'SuperAdmin')}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <div className="flex flex-wrap gap-1 mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('form.parameters.normalRangeTextLabel')}
                            </label>
                            <PermissionBadge hasPermission={session?.user.can_edit_reference_ranges || session.user?.role === 'SuperAdmin'} label="Edit Ranges" />
                            <input
                              type="text"
                              value={param.normal_range_text || ''}
                              onChange={(e) => handleParameterChange(index, 'normal_range_text', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              placeholder={t('form.parameters.normalRangeTextPlaceholder')}
                              disabled={!session?.user?.can_edit_reference_ranges && !(session.user?.role === 'SuperAdmin')}
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={param.is_critical || false}
                            onChange={(e) => handleParameterChange(index, 'is_critical', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            {t('form.parameters.criticalLabel')}
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/${locale}/test-templates`}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                {t('actions.cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSaving ? t('actions.saving') : t('actions.submit')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}