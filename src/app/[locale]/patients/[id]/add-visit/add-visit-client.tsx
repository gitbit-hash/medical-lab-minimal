'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TestSelectionForm } from '../../../../components/test-selection-form';
import { DiscountSection } from '../../../../components/discount-section';
import { PaymentSection } from '../../../../components/payment-section';
import { ReceiptPDFViewerModal } from '@/app/components/ReceiptPDFViewerModal';
import { TestTemplateSearchResult } from '../../../../types';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

interface PatientForVisit {
  id: string;
  name: string;
  gender: string | null;
  age_value: number | null;
  age_unit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  current_visit_number: number;
  doctors: {
    doctor_id: string;
    doctor: {
      id: string;
      name: string;
    };
  }[];
}

interface AddVisitClientProps {
  locale: string;
  patient: PatientForVisit;
  initialDoctors: Doctor[];
  session: any;
  hasUnpaidBalance: boolean;
  currentAmountDue: number;
}

export function AddVisitClient({
  locale,
  patient,
  initialDoctors,
  session,
  hasUnpaidBalance,
  currentAmountDue
}: AddVisitClientProps) {
  const router = useRouter();
  const t = useTranslations('AddVisitPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [doctors] = useState<Doctor[]>(initialDoctors);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>(
    patient.doctors?.map(pd => pd.doctor_id) || []
  );
  const [selectedTests, setSelectedTests] = useState<TestTemplateSearchResult[]>([]);
  const [testSubtotal, setTestSubtotal] = useState(0);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  const [discount, setDiscount] = useState<{
    amount: number;
    percentage: number;
    type: 'Percentage' | 'Fixed';
    reason?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [createdVisit, setCreatedVisit] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [isAmountManuallyModified, setIsAmountManuallyModified] = useState(false);


  // VISIT-SPECIFIC payment state (independent from patient's overall balance)
  const totalFees = testSubtotal;
  const finalTotal = discount ? Math.max(0, totalFees - discount.amount) : totalFees;

  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

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


  // Separate effect to reset everything when selectedTests becomes empty
  useEffect(() => {
    if (selectedTests.length === 0) {
      setDiscount(null);
      setAmountPaidNow(0);
      setRemainingAmount(0);
    }
  }, [selectedTests]);

  const formatCurrency = (amount: number) => {
    return t('currency', { amount: amount.toFixed(2) });
  };

  const userDiscountPermission = {
    can_give_discount: session.user.can_give_discount || false,
    max_discount_percentage: session.user.max_discount_percentage,
    max_discount_amount: session.user.max_discount_amount,
    discount_type: session.user.discount_type,
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (selectedTests.length === 0) {
      errors.push(t('validation.atLeastOneTest'));
    }

    // Age validation for patient (if needed)
    if (patient.age_value && patient.age_value < 0) {
      errors.push(t('validation.ageNonNegative'));
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, generateReceipt: boolean = false) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the visit
      const visitResponse = await fetch(`/api/patients/${patient.id}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_date: visitDate,
          notes: visitNotes,
          doctorIds: selectedDoctors,
          tests: selectedTests.map(test => ({
            test_template_id: test.id,
            test_type: test.name,
            test_code: test.code,
            fees: test.fees || 0,
          })),
          discount: discount ? {
            amount: discount.amount,
            percentage: discount.percentage,
            type: discount.type,
            reason: discount.reason,
          } : null,
          paymentInfo: {
            amount_paid: amountPaidNow,
            amount_due: remainingAmount,
            payment_status: amountPaidNow === finalTotal ? 'Paid' : amountPaidNow > 0 ? 'PartiallyPaid' : 'Unpaid',
            method: paymentMethod,
          }
        }),
      });

      if (!visitResponse.ok) {
        const errorData = await visitResponse.json();
        throw new Error(errorData.error || t('messages.createVisitFailed'));
      }

      const visitData = await visitResponse.json();
      setCreatedVisit(visitData.data.visit);

      // 2. Generate receipt number
      const generatedReceiptNumber = generateReceiptNumber();
      setReceiptNumber(generatedReceiptNumber);

      // 3. Update payment on the visit
      const paymentResponse = await fetch(`/api/visits/${visitData.data.visit.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: amountPaidNow,
          amount_due: remainingAmount,
          payment_status: amountPaidNow === finalTotal ? 'Paid' : amountPaidNow > 0 ? 'PartiallyPaid' : 'Unpaid',
          receipt_number: generatedReceiptNumber,
          payment_method: paymentMethod,
        }),
      });

      if (generateReceipt) {
        // Show receipt modal for this visit
        setShowReceiptModal(true);
      } else {
        // Redirect to patient's tests page
        router.push(`/${locale}/patients/${patient.id}/tests`);
      }

    } catch (error) {
      alert(`${t('messages.createVisitFailed')}: ${error instanceof Error ? error.message : t('messages.unknownError')}`);
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
    return `VISIT-${patient.id.slice(-4)}-${year}${month}${day}-${random}`;
  };

  const handleDoctorToggle = (doctorId: string) => {
    setSelectedDoctors(prev =>
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  return (
    <div className="min-h-full" dir={direction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {(session.user?.can_access_medical_history || session.user?.role === 'SuperAdmin') && (<Link
            href={`/${locale}/patients/${patient.id}/view`}
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            {t('actions.backToPatient')}
          </Link>)}
          <h1 className="text-3xl font-bold text-gray-900">
            {t('hero.title', { name: patient.name })}
          </h1>
          <p className="text-gray-600 mt-2">{t('hero.subtitle')}</p>
        </div>

        {/* Warning if patient has unpaid balance */}
        {hasUnpaidBalance && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-semibold text-yellow-800">
                {t('warnings.unpaidBalance', { amount: currentAmountDue })}
              </span>
            </div>
            <p className="text-yellow-700 text-sm mt-2">
              {t('warnings.cantPrintTests')}
            </p>
          </div>
        )}

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

        {/* Patient Information (Read-only) */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('patientInfo.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patientInfo.name')}
              </label>
              <p className="text-gray-900 font-medium">{patient.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patientInfo.gender')}
              </label>
              <p className="text-gray-900">
                {patient.gender === 'Male' && t('patientInfo.genderMale')}
                {patient.gender === 'Female' && t('patientInfo.genderFemale')}
                {patient.gender === 'Other' && t('patientInfo.genderOther')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patientInfo.age')}
              </label>
              <p className="text-gray-900">
                {patient.age_value} {patient.age_unit}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patientInfo.phone')}
              </label>
              <p className="text-gray-900">{patient.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Visit Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Test Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('form.tests.title')} *
              </h2>
              <p className="text-gray-600 mb-4">{t('form.tests.description')}</p>
              <TestSelectionForm
                selectedTests={selectedTests}
                onTestsChange={setSelectedTests}
                onTotalChange={setTestSubtotal}
              />
            </div>

            {/* Discount Section (Visit-specific) */}
            <DiscountSection
              isDisabled={isSubmitting || selectedTests.length === 0}
              totalFees={totalFees}
              userDiscountPermission={userDiscountPermission}
              onDiscountChange={setDiscount}
              locale={locale}
            />

            {/* Payment Section (Visit-specific) */}
            <PaymentSection
              isDisabled={isSubmitting || selectedTests.length === 0}
              finalTotal={finalTotal}
              amountPaidNow={amountPaidNow}
              setAmountPaidNow={(amount) => {
                setAmountPaidNow(amount);
                setIsAmountManuallyModified(true);
              }}
              remainingAmount={remainingAmount}
              setRemainingAmount={setRemainingAmount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              locale={locale}
              onDiscountApplied={() => setIsAmountManuallyModified(false)}
            />

            {/* Referring Doctors */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('form.doctors.title')}
              </h2>
              <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                {doctors.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    {t('form.doctors.noDoctors')}{' '}
                    <Link href={`/${locale}/doctors/create`} className="text-blue-500 hover:text-blue-700">
                      {t('form.doctors.addDoctorsLink')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <label key={doctor.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDoctors.includes(doctor.id)}
                          disabled={isSubmitting || selectedTests.length === 0}
                          onChange={() => handleDoctorToggle(doctor.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-gray-800">{doctor.name}</span>
                          {doctor.specialization && (
                            <span className="text-gray-500 text-sm ml-2">
                              - {doctor.specialization}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                {t('totalFees')}: {formatCurrency(finalTotal)}
                {discount && discount.amount > 0 && (
                  <div className="text-sm text-green-600 ml-2">
                    ({t('saved')}: {formatCurrency(discount.amount)})
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{t('amountPaidNow')}:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(amountPaidNow)}
                  </span>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{t('remainingAmount')}:</span>
                    <span className="font-semibold text-yellow-600">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-4">
              {
                !isSubmitting && (session.user?.can_access_medical_history || session.user?.role === 'SuperAdmin') ?
                  (
                    <Link
                      href={`/${locale}/patients/${patient.id}/view`}
                      className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      {t('actions.cancel')}
                    </Link>
                  ) : (
                    <button
                      className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 cursor-not-allowed "
                    >
                      {t('actions.cancel')}
                    </button>
                  )
              }
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting || selectedTests.length === 0}
                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? t('actions.creating') : t('actions.saveVisit')}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting || selectedTests.length === 0}
                className="px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? t('actions.creating') : t('actions.saveGenerateReceipt')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && createdVisit && receiptNumber && (
        <ReceiptPDFViewerModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            router.push(`/${locale}/patients`);
          }}
          patientId={patient.id}
          receiptNumber={receiptNumber}
        />
      )}
    </div>
  );
}