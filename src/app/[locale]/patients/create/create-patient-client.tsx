// app/[locale]/patients/create/create-patient-client.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestSelectionForm } from '../../../components/test-selection-form';
import { DiscountSection } from '../../../components/discount-section';
import { ReceiptPDFViewerModal } from '@/app/components/ReceiptPDFViewerModal';
import { PaymentSection } from '../../../components/payment-section';
import { TestTemplateSearchResult } from '../../../types';

// Update the Doctor interface to match Prisma's return type
interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

// Add interface for patient search results
interface PatientSearchResult {
  id: string;
  name: string;
  age_value: number | null;
  age_unit: string | null;
  gender: string;
  phone: string | null;
}

// Add interface for created patient
interface CreatedPatient {
  id: string;
  name: string;
  age_value: number | null;
  age_unit: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface CreatePatientClientProps {
  locale: string;
  initialDoctors: Doctor[];
  session: any;
}

export function CreatePatientClient({ locale, initialDoctors, session }: CreatePatientClientProps) {
  const router = useRouter();
  const t = useTranslations('CreatePatientPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<TestTemplateSearchResult[]>([]);
  const [testSubtotal, setTestSubtotal] = useState(0);
  const [createdVisit, setCreatedVisit] = useState<any>(null);

  const [discount, setDiscount] = useState<{
    amount: number;
    percentage: number;
    type: 'Percentage' | 'Fixed';
    reason?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Add states for patient name search
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(-1);

  const [formData, setFormData] = useState({
    name: '',
    age_value: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age_unit: 'Years',
    phone: '',
    email: '',
    address: '',
  });

  // Add state for created patient
  const [createdPatient, setCreatedPatient] = useState<CreatedPatient | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string>('');

  // Calculate total fees
  const totalFees = testSubtotal;
  const finalTotal = discount ? Math.max(0, totalFees - discount.amount) : totalFees;

  const [amountPaidNow, setAmountPaidNow] = useState<number>(finalTotal);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [isAmountManuallyModified, setIsAmountManuallyModified] = useState(false);

  // Helper function to translate age unit
  const translateAgeUnit = (unit: string | null, value: number | null) => {
    if (!unit || !value) return '';

    // Handle pluralization
    const isPlural = value !== 1;
    const unitKey = unit.toLowerCase()

    return t(`ageUnits.${unitKey}`);
  };

  // Helper function to translate gender
  const translateGender = (gender: string) => {
    return t(`genders.${gender}`);
  };

  // Function to search for patients by name
  const searchPatients = async (query: string) => {
    if (query.length < 3) {
      setPatientSearchResults([]);
      setShowPatientResults(false);
      return;
    }

    setIsSearchingPatients(true);
    try {
      const response = await fetch(`/api/patients/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatientSearchResults(data.data);
          setShowPatientResults(true);
          setSelectedPatientIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  // Handle name input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: value
    }));

    // Search for patients as user types
    searchPatients(value);
  };

  // Handle keyboard navigation in patient search results
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPatientResults || patientSearchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedPatientIndex(prev =>
          prev < patientSearchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedPatientIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedPatientIndex >= 0) {
          const selectedPatient = patientSearchResults[selectedPatientIndex];
          router.push(`/${locale}/patients/${selectedPatient.id}/tests`);
        }
        break;
      case 'Escape':
        setShowPatientResults(false);
        setSelectedPatientIndex(-1);
        break;
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient: PatientSearchResult) => {
    router.push(`/${locale}/patients/${patient.id}/tests`);
  };

  // Update the useEffect that handles amountPaidNow updates
  useEffect(() => {
    if (selectedTests.length === 0) {
      setDiscount(null);
      setAmountPaidNow(0);
      setRemainingAmount(0);
      setIsAmountManuallyModified(false); // Reset manual modification flag
    }
  }, [selectedTests]);

  useEffect(() => {
    if (selectedTests.length === 0) {
      // Don't update payment if no tests are selected
      setAmountPaidNow(0);
      setRemainingAmount(0);
      setIsAmountManuallyModified(false);
      return;
    }

    // Only auto-update to full total if amountPaidNow has NOT been manually modified
    if (!isAmountManuallyModified) {
      setAmountPaidNow(finalTotal);
    }

    // Always calculate remaining amount based on current values
    const calculatedRemaining = Math.max(0, finalTotal - amountPaidNow);
    setRemainingAmount(calculatedRemaining);
  }, [finalTotal, amountPaidNow, selectedTests, isAmountManuallyModified]);

  // Close patient search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPatientResults(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const userDiscountPermission = {
    can_give_discount: session.user.can_give_discount || false,
    max_discount_percentage: session.user.max_discount_percentage,
    max_discount_amount: session.user.max_discount_amount,
    discount_type: session.user.discount_type,
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push(t('validation.nameRequired'));
    } else {
      // Validate that the name has at least 3 parts
      const nameParts = formData.name.trim().split(/\s+/).filter(part => part.length > 0);
      if (nameParts.length < 3) {
        errors.push(t('validation.nameThreeParts'));
      }
    }

    // Age validation
    if (formData.age_value) {
      const ageValue = parseInt(formData.age_value);
      if (isNaN(ageValue) || ageValue < 0) {
        errors.push(t('validation.ageNonNegative'));
      }

      // Additional validation based on unit
      if (formData.age_unit === 'years' && ageValue > 120) {
        errors.push(t('validation.ageUnrealistic'));
      } else if (formData.age_unit === 'months' && ageValue > 1440) {
        errors.push(t('validation.ageUnrealistic'));
      } else if (formData.age_unit === 'days' && ageValue > 43800) {
        errors.push(t('validation.ageUnrealistic'));
      }
    }

    if (selectedTests.length === 0) {
      errors.push(t('validation.atLeastOneTest'));
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Update the handleSubmit function:
  const handleSubmit = async (e: React.FormEvent, generateReceipt: boolean = false) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate receipt number
      const generatedReceiptNumber = generateReceiptNumber();
      setReceiptNumber(generatedReceiptNumber);

      // Create the patient WITH PAYMENT DATA
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age_value: formData.age_value ? parseFloat(formData.age_value) : null,
          doctorIds: selectedDoctors,
          tests: selectedTests.map(test => ({
            test_template_id: test.id,
            test_type: test.name,
            test_code: test.code,
          })),
          // Send ALL payment info in one request
          amount_paid: amountPaidNow,
          amount_due: remainingAmount,
          payment_status: amountPaidNow === finalTotal ? 'Paid' : amountPaidNow > 0 ? 'PartiallyPaid' : 'Unpaid',
          discount_amount: discount?.amount || 0,
          discount_percentage: discount?.percentage || 0,
          discount_type: discount?.type,
          discount_reason: discount?.reason,
          payment_method: paymentMethod,
          receipt_number: generatedReceiptNumber,
        }),
      });

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json();
        throw new Error(errorData.error || t('messages.createPatientFailed'));
      }

      const patientData = await patientResponse.json();
      const patient = patientData.data.patient;
      const visit = patientData.data.visit;
      setCreatedPatient(patient);
      setCreatedVisit(visit);

      if (generateReceipt) {
        setShowReceiptModal(true);
      } else {
        router.push(`/${locale}/patients`);
      }

    } catch (error) {
      alert(`${t('messages.createPatientFailed')}: ${error instanceof Error ? error.message : t('messages.unknownError')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to generate receipt number
  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REC-${year}${month}${day}-${random}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper to display age suggestions
  const getAgeSuggestions = () => {
    if (!formData.age_value) return null;

    const ageValue = parseInt(formData.age_value);
    if (isNaN(ageValue)) return null;

    let suggestions: string[] = [];

    switch (formData.age_unit) {
      case 'years':
        if (ageValue < 1) {
          const months = Math.round(ageValue * 12);
          suggestions.push(t('ageSuggestions.months', { months }));
          suggestions.push(t('ageSuggestions.days', { days: Math.round(ageValue * 365) }));
        } else if (ageValue < 18) {
          suggestions.push(t('ageSuggestions.childAdolescent'));
        } else if (ageValue >= 65) {
          suggestions.push(t('ageSuggestions.senior'));
        }
        break;
      case 'months':
        if (ageValue < 1) {
          suggestions.push(t('ageSuggestions.newborn'));
        } else if (ageValue <= 3) {
          suggestions.push(t('ageSuggestions.infant03'));
        } else if (ageValue <= 12) {
          suggestions.push(t('ageSuggestions.infant312'));
        } else {
          const years = (ageValue / 12).toFixed(1);
          suggestions.push(t('ageSuggestions.years', { years }));
        }
        break;
      case 'days':
        if (ageValue <= 28) {
          suggestions.push(t('ageSuggestions.neonate'));
        } else if (ageValue <= 365) {
          const months = Math.round(ageValue / 30.4);
          suggestions.push(t('ageSuggestions.months', { months }));
        } else {
          const years = (ageValue / 365).toFixed(1);
          suggestions.push(t('ageSuggestions.years', { years }));
        }
        break;
    }

    return suggestions.length > 0 ? suggestions.join(' • ') : null;
  };

  return (
    <div className="min-h-full" dir={direction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${locale}/patients`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            {t('actions.backToPatients')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('hero.title')}</h1>
          <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
        </div>

        {/* Form Errors */}
        {formErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">{t('validation.fixErrors')}</h3>
            <ul className="list-disc list-inside text-red-700">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Patient Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('form.basicInfo.title')}</h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.basicInfo.nameLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      onKeyDown={handleNameKeyDown}
                      onFocus={(e) => {
                        searchPatients(e.target.value);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('form.basicInfo.namePlaceholder')}
                    />
                    {isSearchingPatients && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>

                  {/* Patient Search Results Dropdown */}
                  {showPatientResults && patientSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <ul className="py-1">
                        {patientSearchResults.map((patient, index) => (
                          <li
                            key={patient.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${index === selectedPatientIndex ? 'bg-blue-50' : ''
                              }`}
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="font-medium text-gray-800">{patient.name}</div>
                            <div className="text-sm text-gray-500">
                              {patient.age_value && patient.age_unit && (
                                <span>{t('table.age', {
                                  value: patient.age_value,
                                  unit: translateAgeUnit(patient.age_unit, patient.age_value)
                                })}, </span>
                              )}
                              {patient.gender && <span>{translateGender(patient.gender)}, </span>}
                              {patient.phone && <span>{patient.phone}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                        {t('form.basicInfo.patientSearchHint')}
                      </div>
                    </div>
                  )}

                  {/* Name Format Hint */}
                  <div className="mt-1 text-xs text-gray-500">
                    {t('form.basicInfo.nameFormatHint')}
                  </div>
                </div>

                {/* Gender, Age, and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.basicInfo.genderLabel')} *
                    </label>
                    <select
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Male">{t('form.basicInfo.genderMale')}</option>
                      <option value="Female">{t('form.basicInfo.genderFemale')}</option>
                      <option value="Other">{t('form.basicInfo.genderOther')}</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.basicInfo.ageLabel')} *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        name='age_value'
                        type="number"
                        min="0"
                        step="0.1"
                        required
                        value={formData.age_value}
                        onChange={handleChange}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={t('form.basicInfo.agePlaceholder')}
                      />
                      <select
                        name='age_unit'
                        value={formData.age_unit}
                        onChange={handleChange}
                        className="w-24 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="years">{t('form.basicInfo.ageYears')}</option>
                        <option value="months">{t('form.basicInfo.ageMonths')}</option>
                        <option value="days">{t('form.basicInfo.ageDays')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.contactInfo.phoneLabel')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('form.contactInfo.phonePlaceholder')}
                    />
                  </div>
                </div>

                {/* Age Suggestions */}
                {getAgeSuggestions() && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    <strong>{t('ageSuggestions.title')}:</strong> {getAgeSuggestions()}
                  </div>
                )}

                {/* Age Guidelines */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <strong>{t('ageGuidelines.title')}:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    <li>{t('ageGuidelines.newborns')}</li>
                    <li>{t('ageGuidelines.infants')}</li>
                    <li>{t('ageGuidelines.children')}</li>
                    <li>{t('ageGuidelines.adults')}</li>
                  </ul>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.contactInfo.emailLabel')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.contactInfo.emailPlaceholder')}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.contactInfo.addressLabel')}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('form.contactInfo.addressPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Test Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('form.tests.title')} *</h2>
              <p className="text-gray-600 mb-4">{t('form.tests.description')}</p>
              <TestSelectionForm
                selectedTests={selectedTests}
                onTestsChange={setSelectedTests}
                onTotalChange={setTestSubtotal}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-gray-900">
                  {t('totalFees')}: {t('currency', { amount: finalTotal })}
                  {discount && discount.amount > 0 && (
                    <div className="text-sm text-green-600 ml-2">
                      ({t('saved')} {t('currency', { amount: discount.amount })})
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4">
                <Link
                  href={`/${locale}/patients`}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('actions.cancel')}
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isSubmitting || selectedTests.length === 0}
                  className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? t('actions.creating') : t('savePatientButton')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Fix: Use createdPatient instead of patient */}
      {showReceiptModal && createdPatient && receiptNumber && (
        <ReceiptPDFViewerModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            router.push(`/${locale}/patients`);
          }}
          patientId={createdPatient.id}
          receiptNumber={receiptNumber}
          visitId={createdVisit?.id} // Pass the visit ID
        />
      )}
    </div>
  );
}