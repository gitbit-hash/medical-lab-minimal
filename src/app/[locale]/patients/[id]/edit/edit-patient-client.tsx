// app/[locale]/patients/[id]/edit/edit-patient-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestTemplateWithCategoryAndParams, PatientWithRelations, TestWithRelations } from '../../../../types';

interface EditPatientClientProps {
  locale: string;
  initialPatient: PatientWithRelations;
  session: any;
}

export function EditPatientClient({
  locale,
  initialPatient,
  session
}: EditPatientClientProps) {
  const router = useRouter();
  const t = useTranslations('EditPatientPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: initialPatient.name || '',
    gender: initialPatient.gender as 'Male' | 'Female' | 'Other' || 'Male',
    age_value: initialPatient.age_value?.toString() || '',
    age_unit: (initialPatient.age_unit as 'years' | 'months' | 'days') || 'years',
    phone: initialPatient.phone || '',
    email: initialPatient.email || '',
    address: initialPatient.address || '',
  });

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.name.trim()) {
      errors.push(t('validation.nameRequired'));
    }
    if (formData.age_value) {
      const ageValue = parseFloat(formData.age_value);
      if (isNaN(ageValue) || ageValue < 0) {
        errors.push(t('validation.ageNonNegative'));
      }
    }
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      // First update the patient
      const patientResponse = await fetch(`/api/patients/${initialPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age_value: formData.age_value ? parseFloat(formData.age_value) : null,
        }),
      });

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json();
        throw new Error(errorData.error || t('messages.updatePatientFailed'));
      }

      router.push(`/${locale}/patients`);
    } catch (error) {
      alert(`${t('messages.updatePatientFailed')}: ${error instanceof Error ? error.message : t('messages.unknownError')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getAgeSuggestions = () => {
    if (!formData.age_value) return null;
    const ageNum = parseFloat(formData.age_value);
    if (isNaN(ageNum)) return null;

    let suggestions: string[] = [];
    switch (formData.age_unit) {
      case 'years':
        if (ageNum < 1) {
          const months = Math.round(ageNum * 12);
          suggestions.push(t('ageSuggestions.months', { months }));
        } else if (ageNum < 18) {
          suggestions.push(t('ageSuggestions.childAdolescent'));
        } else if (ageNum >= 65) {
          suggestions.push(t('ageSuggestions.senior'));
        }
        break;
      case 'months':
        if (ageNum < 1) {
          suggestions.push(t('ageSuggestions.newborn'));
        } else if (ageNum <= 3) {
          suggestions.push(t('ageSuggestions.infant03'));
        } else if (ageNum <= 12) {
          suggestions.push(t('ageSuggestions.infant312'));
        } else {
          const years = (ageNum / 12).toFixed(1);
          suggestions.push(t('ageSuggestions.years', { years }));
        }
        break;
      case 'days':
        if (ageNum <= 28) {
          suggestions.push(t('ageSuggestions.neonate'));
        } else if (ageNum <= 365) {
          const months = Math.round(ageNum / 30.4);
          suggestions.push(t('ageSuggestions.months', { months }));
        } else {
          const years = (ageNum / 365).toFixed(1);
          suggestions.push(t('ageSuggestions.years', { years }));
        }
        break;
    }
    return suggestions.length > 0 ? suggestions.join(' • ') : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir={direction}>
      <div className="mx-auto">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/${locale}/patients/${initialPatient.id}`}
                className="text-blue-500 hover:text-blue-700 text-sm inline-flex items-center"
              >
                ← {t('actions.backToPatient')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{t('hero.title')}</h1>
              <p className="text-gray-600 text-sm">{t('hero.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Form Errors - Compact */}
        {formErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <h3 className="font-semibold text-red-800 mb-1">{t('validation.fixErrors')}</h3>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Combined Basic Info and Doctors Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Basic Information - Left Side */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {t('form.basicInfo.title')}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.nameLabel')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.basicInfo.namePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.basicInfo.genderLabel')} *
                    </label>
                    <select
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Male">{t('form.basicInfo.genderMale')}</option>
                      <option value="Female">{t('form.basicInfo.genderFemale')}</option>
                      <option value="Other">{t('form.basicInfo.genderOther')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.basicInfo.ageLabel')}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        name="age_value"
                        min="0"
                        step="0.1"
                        value={formData.age_value}
                        required
                        onChange={handleChange}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder={t('form.basicInfo.agePlaceholder')}
                      />
                      <select
                        name="age_unit"
                        value={formData.age_unit}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 w-20"
                      >
                        <option value="years">Yrs</option>
                        <option value="months">Mos</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                    {getAgeSuggestions() && (
                      <div className="mt-1 p-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                        {getAgeSuggestions()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.contactInfo.phoneLabel')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('form.contactInfo.phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.contactInfo.emailLabel')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('form.contactInfo.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.contactInfo.addressLabel')}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.contactInfo.addressPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Form Actions */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Link
                  href={`/${locale}/patients/${initialPatient.id}`}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {t('actions.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isSubmitting ? t('actions.updating') : t('actions.submit')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}