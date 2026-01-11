'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface DiscountSectionProps {
  isDisabled: boolean;
  totalFees: number;
  currentDiscount?: {
    amount: number;
    percentage: number;
    type: 'Percentage' | 'Fixed';
    reason?: string;
  };
  userDiscountPermission: {
    can_give_discount: boolean;
    max_discount_percentage: number | null;
    max_discount_amount: number | null;
    discount_type: 'Percentage' | 'Fixed' | null;
  };
  onDiscountChange: (discount: {
    amount: number;
    percentage: number;
    type: 'Percentage' | 'Fixed';
    reason?: string;
  } | null) => void;
  locale: string;
  initialDiscount?: any;
}

export function DiscountSection({
  isDisabled = true,
  totalFees,
  currentDiscount,
  userDiscountPermission,
  onDiscountChange,
  locale
}: DiscountSectionProps) {
  const t = useTranslations('DiscountSection');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [showDiscount, setShowDiscount] = useState(!!currentDiscount);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed'>(
    currentDiscount?.type || userDiscountPermission.discount_type || 'Percentage'
  );

  // Initialize with current discount or empty
  const [discountValueString, setDiscountValueString] = useState(
    currentDiscount ?
      (currentDiscount.type === 'Percentage'
        ? currentDiscount.percentage.toString()
        : currentDiscount.amount.toString())
      : ''
  );
  const [discountReason, setDiscountReason] = useState(currentDiscount?.reason || '');

  // Calculate max allowed values
  const maxPercentage = userDiscountPermission.max_discount_percentage || 100;
  const maxFixedAmount = userDiscountPermission.max_discount_amount || totalFees;

  // Helper function to get numeric value
  const getNumericDiscountValue = (): number => {
    const numericValue = parseFloat(discountValueString);
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // Format currency helper - handles RTL languages correctly
  const formatCurrency = (amount: number): string => {
    if (locale === 'ar') {
      // For Arabic, currency symbol goes after the amount
      return amount.toFixed(2) + t('currency');
    } else {
      // For other languages, currency symbol goes before the amount
      return t('currency') + amount.toFixed(2);
    }
  };

  // Calculate discount amounts
  const numericDiscountValue = getNumericDiscountValue();

  // Calculate actual discount based on type and limits
  const calculateActualDiscount = () => {
    if (!showDiscount || numericDiscountValue <= 0) return 0;

    if (discountType === 'Percentage') {
      // Apply percentage discount, but not exceeding max percentage
      const actualPercentage = Math.min(numericDiscountValue, maxPercentage);
      return totalFees * (actualPercentage / 100);
    } else {
      // Apply fixed discount, but not exceeding max fixed amount or total fees
      const actualAmount = Math.min(
        numericDiscountValue,
        maxFixedAmount,
        totalFees
      );
      return actualAmount;
    }
  };

  const calculatedDiscountAmount = calculateActualDiscount();
  const calculatedDiscountPercentage = discountType === 'Percentage'
    ? Math.min(numericDiscountValue, maxPercentage)
    : totalFees > 0 ? (calculatedDiscountAmount / totalFees) * 100 : 0;

  const finalTotal = Math.max(0, totalFees - calculatedDiscountAmount);

  // Validate input value
  const getValidationError = (): string | null => {
    if (!showDiscount || numericDiscountValue <= 0) return null;

    if (discountType === 'Percentage') {
      if (numericDiscountValue > maxPercentage) {
        return t('validation.maxPercentageExceeded', { max: maxPercentage });
      }
    } else {
      if (numericDiscountValue > maxFixedAmount) {
        // Format the max amount for the error message
        const maxAmount = locale === 'ar'
          ? formatCurrency(maxFixedAmount)
          : t('currency') + maxFixedAmount.toFixed(2);
        return t('validation.maxAmountExceeded', { max: maxAmount });
      }
      if (numericDiscountValue > totalFees) {
        return t('validation.discountExceedsTotal');
      }
    }

    if (numericDiscountValue < 0) {
      return t('validation.negativeDiscount');
    }

    return null;
  };

  const validationError = getValidationError();

  // Notify parent of discount changes - always call this with validated values
  useEffect(() => {
    if (showDiscount && numericDiscountValue > 0 && !validationError) {
      onDiscountChange({
        amount: calculatedDiscountAmount,
        percentage: calculatedDiscountPercentage,
        type: discountType,
        reason: discountReason
      });
    } else {
      onDiscountChange(null);
    }
  }, [
    showDiscount,
    discountValueString,
    discountType,
    discountReason,
    calculatedDiscountAmount,
    calculatedDiscountPercentage,
    validationError,
    onDiscountChange,
  ]);

  // Handle input change with validation
  const handleDiscountValueChange = (value: string) => {
    // Allow empty string, numbers, and decimal point
    if (isDisabled) {
      setDiscountValueString('')
    }

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDiscountValueString(value);
    }
  };

  // Handle blur - clamp to limits
  const handleDiscountValueBlur = () => {
    const numericValue = getNumericDiscountValue();

    if (numericValue === 0) {
      setDiscountValueString('');
      return;
    }

    let clampedValue = numericValue;

    if (discountType === 'Percentage') {
      if (numericValue > maxPercentage) {
        clampedValue = maxPercentage;
      }
    } else {
      if (numericValue > maxFixedAmount) {
        clampedValue = maxFixedAmount;
      }
      if (numericValue > totalFees) {
        clampedValue = totalFees;
      }
    }

    // Don't allow negative values
    if (clampedValue < 0) {
      clampedValue = 0;
    }

    setDiscountValueString(clampedValue.toString());
  };

  // Reset discount when switching types
  const handleDiscountTypeChange = (type: 'Percentage' | 'Fixed') => {
    setDiscountType(type);
    setDiscountValueString('');
  };

  // Handle toggle discount
  const handleToggleDiscount = () => {
    const newShowDiscount = !showDiscount;
    setShowDiscount(newShowDiscount);

    if (!newShowDiscount) {
      setDiscountValueString('');
      setDiscountReason('');
      onDiscountChange(null);
    }
  };

  if (!userDiscountPermission.can_give_discount) {
    return null;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" dir={direction}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 disabled:opacity-50">{t('title')}</h3>
        <button
          type="button"
          onClick={handleToggleDiscount}
          disabled={isDisabled}
          className={`px-4 py-2 rounded-md text-sm font-medium 
            ${isDisabled
              ? 'bg-green-100 text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              : showDiscount
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
        >
          {showDiscount ? t('actions.removeDiscount') : t('actions.addDiscount')}
        </button>
      </div>

      {showDiscount && !isDisabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('discountType.label')}
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange('Percentage')}
                  className={`flex-1 py-2 px-3 rounded border text-sm font-medium ${discountType === 'Percentage'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {t('discountType.percentage')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange('Fixed')}
                  className={`flex-1 py-2 px-3 rounded border text-sm font-medium ${discountType === 'Fixed'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {t('discountType.fixed')}
                </button>
              </div>
            </div>

            {/* Discount Value Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {discountType === 'Percentage' ? t('discountValue.percentage') : t('discountValue.fixed')}
                <span className="text-xs text-gray-500 ml-1">
                  ({t('limits.max')}: {
                    discountType === 'Percentage'
                      ? `${maxPercentage}%`
                      : formatCurrency(Math.min(maxFixedAmount, totalFees))
                  })
                </span>
              </label>
              <div className="flex items-center space-x-2">
                {discountType === 'Percentage' ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      max={maxPercentage}
                      step="0.1"
                      value={discountValueString}
                      onChange={(e) => handleDiscountValueChange(e.target.value)}
                      onBlur={handleDiscountValueBlur}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">%</span>
                  </>
                ) : (
                  <div className="flex items-center w-full">
                    {/* For RTL languages (Arabic), currency symbol goes after the input */}
                    {locale !== 'ar' && (
                      <span className="py-2 px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                        {t('currency')}
                      </span>
                    )}
                    <input
                      type="number"
                      min="0"
                      max={Math.min(maxFixedAmount, totalFees)}
                      step="0.01"
                      value={discountValueString}
                      onChange={(e) => handleDiscountValueChange(e.target.value)}
                      onBlur={handleDiscountValueBlur}
                      className={`flex-1 p-2 border ${locale === 'ar' ? 'border-r-0 rounded-r-md' : 'border-l-0 rounded-r-md'} focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {locale === 'ar' && (
                      <span className="py-2 px-3 border border-l-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500">
                        {t('currency')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discount Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('reason.label')} <span className="text-gray-400 text-xs">({t('reason.optional')})</span>
            </label>
            <textarea
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('reason.placeholder')}
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{validationError}</p>
            </div>
          )}

          {/* Discount Summary - Always show when discount is enabled */}
          {showDiscount && (
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('summary.title')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('summary.originalTotal')}</span>
                  <span className="font-medium text-gray-600">{formatCurrency(totalFees)}</span>
                </div>

                {numericDiscountValue > 0 && !validationError && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-red-600">
                        {t('summary.discount')}
                        {discountType === 'Percentage' ? ` (${numericDiscountValue}%)` : ''}
                      </span>
                      <span className="text-red-600 font-medium">
                        -{formatCurrency(calculatedDiscountAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-green-600">{t('summary.finalTotal')}</span>
                      <span className="font-bold text-green-600">{formatCurrency(finalTotal)}</span>
                    </div>
                  </>
                )}

                {numericDiscountValue === 0 && (
                  <div className="text-center text-gray-500 py-2">
                    {t('summary.enterDiscountValue')}
                  </div>
                )}

                {validationError && (
                  <div className="text-center text-red-500 py-2">
                    {t('summary.invalidDiscount')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}