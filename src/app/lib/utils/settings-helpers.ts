// app/lib/utils/settings-helpers.ts
export function transformReceiptSettings(dbSettings: any[]) {
  const result: Record<string, any> = {};

  dbSettings.forEach(setting => {
    const key = setting.key.replace('receipt.', '');

    // Skip null or undefined values
    if (setting.value !== null && setting.value !== undefined) {
      // Handle specific types based on key patterns
      if (key.includes('.enabled') || key.includes('.showOnPaidReceipts')) {
        // Boolean values
        result[key] = Boolean(setting.value);
      } else if (key === 'qrCode.position') {
        // Ensure position is one of the allowed values
        const allowedPositions = ['right'];
        result[key] = allowedPositions.includes(String(setting.value))
          ? setting.value
          : 'bottom';
      } else {
        // String values
        result[key] = String(setting.value);
      }
    }
  });

  return result;
}