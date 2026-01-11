'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface PaymentSectionProps {
  isDisabled: boolean;
  finalTotal: number;
  amountPaidNow: number;
  setAmountPaidNow: (amount: number) => void;
  remainingAmount: number;
  setRemainingAmount: (amount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  locale: string;
  onDiscountApplied?: () => void; // Add this new prop
}

export function PaymentSection({
  isDisabled,
  finalTotal,
  amountPaidNow,
  setAmountPaidNow,
  remainingAmount,
  setRemainingAmount,
  paymentMethod,
  setPaymentMethod,
  locale,
  onDiscountApplied
}: PaymentSectionProps) {
  const t = useTranslations('PaymentSection');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [amountPaidNowString, setAmountPaidNowString] = useState(
    amountPaidNow === 0 ? '' : amountPaidNow.toString()
  );
  const [error, setError] = useState<string | null>(null);

  // Sync string with parent amountPaidNow when it changes externally
  useEffect(() => {
    // Only auto-update if the payment hasn't been manually set
    // This effect runs when finalTotal changes (including when discount is applied)
    if (amountPaidNow === 0 || Math.abs(amountPaidNow - finalTotal) < 0.01) {
      // If payment is 0 or already matches the total, update it
      setAmountPaidNow(finalTotal);
      setAmountPaidNowString(finalTotal === 0 ? '' : finalTotal.toString());
      if (onDiscountApplied) {
        onDiscountApplied(); // Notify parent that discount has been applied
      }
    }
  }, [finalTotal, amountPaidNow, onDiscountApplied]);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    if (locale === 'ar') {
      return amount.toFixed(2) + t('currency');
    } else {
      return t('currency') + amount.toFixed(2);
    }
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return t('currency');
  };

  // Handle string input change in real-time
  const handleAmountStringChange = (value: string) => {
    if (isDisabled) {
      setAmountPaidNowString('');
      return;
    }

    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountPaidNowString(value);

      // Update parent state in real-time
      if (value === '' || value === null) {
        setAmountPaidNow(0);
        const calculatedRemaining = Math.max(0, finalTotal - 0);
        setRemainingAmount(calculatedRemaining);
        setError(null);
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          setAmountPaidNow(0);
          const calculatedRemaining = Math.max(0, finalTotal - 0);
          setRemainingAmount(calculatedRemaining);
          setError(null);
        } else {
          // Validate in real-time
          if (numValue > finalTotal) {
            setError(`${t('validation.amountExceedsTotal')} ${formatCurrency(finalTotal)}`);
            // Still update parent but clamp to max
            const clampedValue = finalTotal;
            setAmountPaidNow(clampedValue);
            const calculatedRemaining = Math.max(0, finalTotal - clampedValue);
            setRemainingAmount(calculatedRemaining);
          } else if (numValue < 0) {
            setError(t('validation.negativeAmount'));
            setAmountPaidNow(0);
            const calculatedRemaining = Math.max(0, finalTotal - 0);
            setRemainingAmount(calculatedRemaining);
          } else {
            setError(null);
            setAmountPaidNow(numValue);
            const calculatedRemaining = Math.max(0, finalTotal - numValue);
            setRemainingAmount(calculatedRemaining);
          }
        }
      }
    }
  };

  // Handle blur for final formatting
  const handleAmountBlur = () => {
    if (amountPaidNowString === '' || isDisabled) {
      setAmountPaidNow(0);
      setAmountPaidNowString('');
      setError(null);
      const calculatedRemaining = Math.max(0, finalTotal - 0);
      setRemainingAmount(calculatedRemaining);
      return;
    }

    const numValue = parseFloat(amountPaidNowString);
    if (isNaN(numValue)) {
      setAmountPaidNow(0);
      setAmountPaidNowString('');
      setError(null);
      const calculatedRemaining = Math.max(0, finalTotal - 0);
      setRemainingAmount(calculatedRemaining);
      return;
    }

    // Clamp to valid range (0 to finalTotal)
    let clampedValue = Math.max(0, numValue);
    if (clampedValue > finalTotal) {
      clampedValue = finalTotal;
      setError(`${t('validation.amountExceedsTotal')} ${formatCurrency(finalTotal)}`);
    } else {
      setError(null);
    }

    setAmountPaidNow(clampedValue);
    setAmountPaidNowString(clampedValue.toString());
    const calculatedRemaining = Math.max(0, finalTotal - clampedValue);
    setRemainingAmount(calculatedRemaining);
  };

  // Handle full payment button click
  const handleFullPayment = () => {
    if (isDisabled) return;
    setAmountPaidNow(finalTotal);
    setAmountPaidNowString(finalTotal.toString());
    const calculatedRemaining = Math.max(0, finalTotal - finalTotal);
    setRemainingAmount(calculatedRemaining);
    setError(null);
  };

  // Handle clear payment button click
  const handleClearPayment = () => {
    if (isDisabled) return;
    setAmountPaidNow(0);
    setAmountPaidNowString('');
    const calculatedRemaining = Math.max(0, finalTotal - 0);
    setRemainingAmount(calculatedRemaining);
    setError(null);
  };

  // Reset when finalTotal becomes 0 (no tests selected)
  useEffect(() => {
    if (finalTotal === 0 && !isDisabled) {
      handleClearPayment();
    }
  }, [finalTotal, isDisabled]);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" dir={direction}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 disabled:opacity-50">
          {t('title')}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFullPayment}
            disabled={isDisabled || finalTotal === 0}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('fullPayment')}
          </button>
          <button
            type="button"
            onClick={handleClearPayment}
            disabled={isDisabled || finalTotal === 0}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('clearPayment')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Amount Paid Now */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('amountPaidNowLabel')}
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className='flex flex-1'>
              {locale === 'ar' ? (
                <>
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isDisabled || finalTotal === 0}
                    value={amountPaidNowString}
                    onChange={(e) => handleAmountStringChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    className={`px-3 py-2 border rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1
                      ${error ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder={finalTotal === 0 ? t('noTestsSelected') : t('amountPlaceholder')}
                  />
                  <span className="inline-flex items-center px-3 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                    {getCurrencySymbol()}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center px-3 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isDisabled || finalTotal === 0}
                    value={amountPaidNowString}
                    onChange={(e) => handleAmountStringChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    className={`px-3 py-2 border rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1
                      ${error ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder={finalTotal === 0 ? t('noTestsSelected') : t('amountPlaceholder')}
                  />
                </>
              )}
            </div>

            {/* Payment Method */}
            <div className='flex items-center gap-2'>
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {t('paymentMethodLabel')}
              </label>
              <select
                value={paymentMethod}
                disabled={isDisabled || finalTotal === 0}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="Cash">{t('paymentMethods.cash')}</option>
                <option value="Card">{t('paymentMethods.card')}</option>
                <option value="Insurance">{t('paymentMethods.insurance')}</option>
                <option value="Bank Transfer">{t('paymentMethods.bankTransfer')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              {t('maxAmount')}: {formatCurrency(finalTotal)}
            </p>
            {error && (
              <p className="text-xs text-red-600 font-medium">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{t('summary.title')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('summary.finalTotal')}</span>
              <span className="font-medium text-gray-700">{formatCurrency(finalTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">{t('summary.amountPaidNow')}</span>
              <span className="font-medium text-green-600">{formatCurrency(amountPaidNow)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold text-yellow-600">{t('summary.remainingAmount')}</span>
              <span className="font-bold text-yellow-600">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Validation Error Warning */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-red-700 font-semibold text-sm">
                  {t('validation.warningTitle')}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Remaining Amount Note */}
        {remainingAmount > 0 && !error && finalTotal > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 font-semibold text-sm">
              {t('remainingNote.title')}: {formatCurrency(remainingAmount)}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {t('remainingNote.description')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}