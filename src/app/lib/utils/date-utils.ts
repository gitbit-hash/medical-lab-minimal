// lib/utils/date-utils.ts
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDateForInput:', date);
      return '';
    }

    // Format as YYYY-MM-DD for date input
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function parseInputDate(dateString: string): Date | null {
  if (!dateString) return null;

  try {
    // The date input returns YYYY-MM-DD format
    // This creates a Date at local time 00:00:00
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string provided to parseInputDate:', dateString);
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

// lib/utils/date-utils.ts
// Add these functions to your existing date-utils file

export function getDaysUntilExpiration(expiredAt: Date | string | null | undefined): number | null {
  if (!expiredAt) return null;

  try {
    const expirationDate = typeof expiredAt === 'string' ? new Date(expiredAt) : expiredAt;
    const today = new Date();

    // Reset time part to avoid time influencing the day difference
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error('Error calculating days until expiration:', error);
    return null;
  }
}

export function isExpiringSoon(expiredAt: Date | string | null | undefined, thresholdDays: number = 15): boolean {
  const daysRemaining = getDaysUntilExpiration(expiredAt);
  return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= thresholdDays;
}

export function isExpired(expiredAt: Date | string | null | undefined): boolean {
  const daysRemaining = getDaysUntilExpiration(expiredAt);
  return daysRemaining !== null && daysRemaining < 0;
}

export function formatDaysRemaining(days: number | null, t: any): string {
  if (days === null) return '';

  if (days < 0) {
    return t('card.expired');
  }

  if (days === 0) {
    return t('card.expiresToday');
  }

  if (days === 1) {
    return t('card.expiresInOneDay');
  }

  // Use the translation function correctly - without curly braces in the key
  return t('card.expiresInDays', { days });
}

