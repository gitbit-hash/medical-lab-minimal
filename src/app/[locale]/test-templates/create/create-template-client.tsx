// app/[locale]/test-templates/create/create-template-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestCategoryBase } from '../../../types';
import { parseInputDate } from '../../../lib/utils/date-utils';

interface CreateTestTemplateClientProps {
  locale: string;
  initialCategories: TestCategoryBase[];
  session: any;
}

interface Parameter {
  name: string;
  code: string;
  units: string;
  normal_range_min: number | null;
  normal_range_max: number | null;
  normal_range_text: string;
  default_value: string; // Add this
  is_critical: boolean;
  sort_order: number;
}

export function CreateTestTemplateClient({
  locale,
  initialCategories,
}: CreateTestTemplateClientProps) {
  const t = useTranslations('CreateTestTemplatePage');
  const router = useRouter();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [categories] = useState<TestCategoryBase[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_id: '',
    description: '',
    specimen: '',
    container: '',
    volume: '',
    storage: '',
    methodology: '',
    turnaround_time: '',
    fees: '',
    is_active: true,
    expired_at: '',
    andrology_test_type: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestBody = {
        ...formData,
        fees: formData.fees ? parseFloat(formData.fees) : 0,
        expired_at: formData.expired_at ? parseInputDate(formData.expired_at) : null,
        parameters: parameters,
      };


      const response = await fetch('/api/test-templates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/test-templates`);
      } else {
        // Try to get text first to see what's returned
        const textResponse = await response.text();

        try {
          const error = JSON.parse(textResponse);
          alert(t('messages.createError', { error: error.error || t('messages.unknownError') }));
        } catch (parseError) {
          alert(`Server error ${response.status}: ${response.statusText}\n${textResponse}`);
        }
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      alert(t('messages.createErrorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleParameterChange = (index: number, field: keyof Parameter, value: any) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = {
      ...updatedParameters[index],
      [field]: field === 'normal_range_min' || field === 'normal_range_max' || field === 'sort_order'
        ? (value ? parseFloat(value) : null)
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
      default_value: '', // Add default empty string
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
                  <label htmlFor="andrology_test_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Andrology Test Type (Optional)
                  </label>
                  <select
                    id="andrology_test_type"
                    name="andrology_test_type"
                    value={formData.andrology_test_type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None - Regular Test</option>
                    <option value="SemenAnalysis">Semen Analysis</option>
                    <option value="CASA">Computer-Assisted Semen Analysis (CASA)</option>
                    <option value="SpermDNAFragmentation">Sperm DNA Fragmentation</option>
                    <option value="SpermFunctionTests">Sperm Function Tests</option>
                    <option value="PostCoitalTest">Post Coital Test</option>
                    <option value="SpermCryopreservation">Sperm Cryopreservation</option>
                    <option value="SpermPreparation">Sperm Preparation</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select for specialized andrology tests. This enables special forms and reports.
                  </p>
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.nameLabel')} *
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.basicInfo.namePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.codeLabel')} *
                  </label>
                  <input
                    id="code"
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.basicInfo.codePlaceholder')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.categoryLabel')} *
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleChange}
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
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.basicInfo.descriptionPlaceholder')}
                  />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('form.testDetails.title')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.feesLabel')} *
                  </label>
                  <input
                    id="fees"
                    required
                    type="number"
                    name="fees"
                    step="0.01"
                    value={formData.fees}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="specimen" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.specimenLabel')} *
                  </label>
                  <input
                    id="specimen"
                    type="text"
                    name="specimen"
                    required
                    value={formData.specimen}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.testDetails.specimenPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="container" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.containerLabel')}
                  </label>
                  <input
                    id="container"
                    type="text"
                    name="container"
                    value={formData.container}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.testDetails.containerPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.volumeLabel')}
                  </label>
                  <input
                    id="volume"
                    type="text"
                    name="volume"
                    value={formData.volume}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.testDetails.volumePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.storageLabel')}
                  </label>
                  <input
                    id="storage"
                    type="text"
                    name="storage"
                    value={formData.storage}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.testDetails.storagePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="turnaround_time" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.turnaroundTimeLabel')}
                  </label>
                  <input
                    id="turnaround_time"
                    type="text"
                    name="turnaround_time"
                    value={formData.turnaround_time}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.testDetails.turnaroundTimePlaceholder')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.testDetails.methodologyLabel')}
                  </label>
                  <input
                    id="methodology"
                    type="text"
                    name="methodology"
                    value={formData.methodology}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.testDetails.methodologyPlaceholder')}
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
                    name="expired_at"
                    value={formData.expired_at}
                    onChange={handleChange}
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
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.normalRangeMinLabel')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={param.normal_range_min ?? 0}
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.normalRangeMaxLabel')}
                          </label>
                          <input
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.parameters.normalRangeTextLabel')}
                          </label>
                          <input
                            type="text"
                            value={param.normal_range_text || ''}
                            onChange={(e) => handleParameterChange(index, 'normal_range_text', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('form.parameters.normalRangeTextPlaceholder')}
                          />
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
                disabled={isSubmitting}
                className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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