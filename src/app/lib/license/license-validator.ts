// lib/license/license-validator.ts
/**
 * Hybrid License Validation Service
 * Supports offline grace period for offline-first architecture
 */

import { localPrisma } from '../db/local-client';
import { ErrorLogger, ErrorSeverity } from '../error-logger';
import { getOptionalEnvVarNumber } from '../env-validation';
import { getMachineFingerprintEnhanced } from './machine-fingerprint';

export enum LicenseStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  INVALID = 'invalid',
  SUSPENDED = 'suspended',
  GRACE_PERIOD = 'grace_period',
  TRIAL = 'trial',
  MACHINE_MISMATCH = 'machine_mismatch', // License is bound to a different machine
}

export interface LicenseValidationResult {
  status: LicenseStatus;
  isValid: boolean;
  message: string;
  expiresAt?: Date;
  gracePeriodEndsAt?: Date;
  daysRemaining?: number;
  daysInGracePeriod?: number;
}

export interface LicenseInfo {
  licenseKey: string;
  status: string;
  expiresAt: Date | null;
  lastValidatedAt: Date | null;
  offlineValidatedAt: Date | null;
  gracePeriodEndsAt: Date | null;
  maxUsers: number | null;
  maxDevices: number | null;
  machineId: string | null; // Machine fingerprint this license is bound to
}

class LicenseValidator {
  private readonly validationEnabled: boolean;
  private readonly offlineGracePeriodDays: number;
  private readonly validationInterval: number; // in milliseconds
  private validationIntervalId: NodeJS.Timeout | null = null;
  private cachedValidation: LicenseValidationResult | null = null;
  private lastValidationTime: Date | null = null;

  constructor() {
    // Configuration from environment variables
    this.validationEnabled = process.env.LICENSE_VALIDATION_ENABLED !== 'false';
    this.offlineGracePeriodDays = getOptionalEnvVarNumber('LICENSE_OFFLINE_GRACE_DAYS', 7);
    this.validationInterval = getOptionalEnvVarNumber('LICENSE_VALIDATION_INTERVAL', 86400000); // 24 hours

    if (this.validationEnabled) {
      console.log('🔐 License validation enabled');
      console.log(`   Offline grace period: ${this.offlineGracePeriodDays} days`);
    } else {
      console.log('⚠️ License validation disabled (LICENSE_VALIDATION_ENABLED=false)');
    }
  }

  /**
   * Validates the license key
   * Supports both online and offline validation with grace period
   */
  async validateLicense(licenseKey?: string): Promise<LicenseValidationResult> {
    // If validation is disabled, always return valid
    if (!this.validationEnabled) {
      return {
        status: LicenseStatus.VALID,
        isValid: true,
        message: 'License validation is disabled',
      };
    }

    const key = licenseKey || process.env.LICENSE_KEY;

    if (!key) {
      return {
        status: LicenseStatus.INVALID,
        isValid: false,
        message: 'License key is not configured. Please set LICENSE_KEY environment variable.',
      };
    }

    try {
      // Try to get license from database
      const license = await this.getLicenseFromDatabase(key);

      if (!license) {
        // License not in database - try to create/validate it
        return await this.createAndValidateLicense(key);
      }

      // Validate existing license
      return await this.validateExistingLicense(license);
    } catch (error) {
      await ErrorLogger.logSystemError(
        'License validation failed',
        error,
        'HIGH' as ErrorSeverity,
        { licenseKey: this.maskLicenseKey(key) }
      );

      // In case of error, check if we're in grace period
      return await this.checkGracePeriod(key);
    }
  }

  /**
   * Gets license from database
   */
  private async getLicenseFromDatabase(licenseKey: string): Promise<LicenseInfo | null> {
    try {
      const license = await localPrisma.license.findUnique({
        where: { license_key: licenseKey },
      });

      if (!license) return null;

      return {
        licenseKey: license.license_key,
        status: license.status,
        expiresAt: license.expires_at,
        lastValidatedAt: license.last_validated_at,
        offlineValidatedAt: license.offline_validated_at,
        gracePeriodEndsAt: license.grace_period_ends_at,
        maxUsers: license.max_users,
        maxDevices: license.max_devices,
        machineId: license.machine_id,
      };
    } catch (error) {
      console.error('Failed to get license from database:', error);
      return null;
    }
  }

  /**
   * Creates and validates a new license
   * Binds the license to the current machine
   */
  private async createAndValidateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    // For now, we'll create a basic license entry
    // In production, you'd validate against a license server or verify the key format

    try {
      // Basic license key validation (you can enhance this)
      if (!this.isValidLicenseKeyFormat(licenseKey)) {
        return {
          status: LicenseStatus.INVALID,
          isValid: false,
          message: 'Invalid license key format',
        };
      }

      // Get current machine fingerprint
      const currentMachineId = await getMachineFingerprintEnhanced();

      // Check if license already exists (might have been created on another machine)
      const existingLicense = await localPrisma.license.findUnique({
        where: { license_key: licenseKey },
      });

      if (existingLicense && existingLicense.machine_id) {
        // License already exists and is bound to a different machine
        if (existingLicense.machine_id !== currentMachineId) {
          return {
            status: LicenseStatus.MACHINE_MISMATCH,
            isValid: false,
            message: 'This license is already bound to another machine. Each license can only be used on a single machine.',
          };
        }
        // License exists and is bound to this machine - proceed with validation
      }

      // Create license entry (you can add expiration logic here)
      const expiresAt = this.calculateExpirationDate(licenseKey);

      const license = await localPrisma.license.upsert({
        where: { license_key: licenseKey },
        update: {
          status: 'active',
          expires_at: expiresAt,
          last_validated_at: new Date(),
          updated_at: new Date(),
          // Only update machine_id if it's not already set (to prevent overwriting)
          machine_id: existingLicense?.machine_id || currentMachineId,
        },
        create: {
          license_key: licenseKey,
          status: 'active',
          expires_at: expiresAt,
          last_validated_at: new Date(),
          offline_validated_at: new Date(),
          machine_id: currentMachineId, // Bind to current machine
        },
      });

      return {
        status: LicenseStatus.VALID,
        isValid: true,
        message: 'License validated successfully and bound to this machine',
        expiresAt: license.expires_at || undefined,
        daysRemaining: expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined,
      };
    } catch (error) {
      console.error('Failed to create license:', error);
      return {
        status: LicenseStatus.INVALID,
        isValid: false,
        message: 'Failed to validate license',
      };
    }
  }

  /**
   * Validates an existing license
   * Checks machine binding to ensure license is only used on the authorized machine
   */
  private async validateExistingLicense(license: LicenseInfo): Promise<LicenseValidationResult> {
    const now = new Date();

    // Check machine binding - ensure license is only used on the authorized machine
    const currentMachineId = await getMachineFingerprintEnhanced();

    if (license.machineId) {
      // License is bound to a specific machine
      if (license.machineId !== currentMachineId) {
        return {
          status: LicenseStatus.MACHINE_MISMATCH,
          isValid: false,
          message: 'This license is bound to another machine. Each license can only be used on a single machine. Please contact support if you need to transfer your license.',
        };
      }
    } else {
      // License exists but is not bound to any machine yet
      // This can happen for licenses created before machine binding was implemented
      // Bind it to the current machine
      try {
        await localPrisma.license.update({
          where: { license_key: license.licenseKey },
          data: {
            machine_id: currentMachineId,
          },
        });
        console.log('License bound to current machine');
      } catch (error) {
        console.error('Failed to bind license to machine:', error);
      }
    }

    // Check if license is suspended
    if (license.status === 'suspended') {
      return {
        status: LicenseStatus.SUSPENDED,
        isValid: false,
        message: 'License has been suspended',
      };
    }

    // Check if license is expired
    if (license.expiresAt && license.expiresAt < now) {
      // Check if we're in grace period
      if (license.gracePeriodEndsAt && license.gracePeriodEndsAt > now) {
        const daysInGrace = Math.ceil((license.gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          status: LicenseStatus.GRACE_PERIOD,
          isValid: true, // Still valid during grace period
          message: `License expired but in grace period. ${daysInGrace} days remaining.`,
          gracePeriodEndsAt: license.gracePeriodEndsAt,
          daysInGracePeriod: daysInGrace,
        };
      }

      return {
        status: LicenseStatus.EXPIRED,
        isValid: false,
        message: 'License has expired',
        expiresAt: license.expiresAt,
      };
    }

    // License is valid
    const daysRemaining = license.expiresAt
      ? Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Update last validated time
    await this.updateLastValidatedTime(license.licenseKey);

    return {
      status: LicenseStatus.VALID,
      isValid: true,
      message: 'License is valid',
      expiresAt: license.expiresAt || undefined,
      daysRemaining,
    };
  }

  /**
   * Checks if we're in grace period (for offline scenarios)
   */
  private async checkGracePeriod(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      const license = await localPrisma.license.findUnique({
        where: { license_key: licenseKey },
      });

      if (!license) {
        return {
          status: LicenseStatus.INVALID,
          isValid: false,
          message: 'License not found',
        };
      }

      const now = new Date();
      const lastValidation = license.offline_validated_at || license.last_validated_at;

      if (lastValidation) {
        const daysSinceValidation = Math.floor(
          (now.getTime() - lastValidation.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceValidation <= this.offlineGracePeriodDays) {
          const daysRemaining = this.offlineGracePeriodDays - daysSinceValidation;
          return {
            status: LicenseStatus.GRACE_PERIOD,
            isValid: true,
            message: `Offline grace period active. ${daysRemaining} days remaining.`,
            daysInGracePeriod: daysRemaining,
          };
        }
      }

      return {
        status: LicenseStatus.INVALID,
        isValid: false,
        message: 'License validation failed and grace period expired',
      };
    } catch (error) {
      return {
        status: LicenseStatus.INVALID,
        isValid: false,
        message: 'Failed to check grace period',
      };
    }
  }

  /**
   * Updates the last validated time
   */
  private async updateLastValidatedTime(licenseKey: string): Promise<void> {
    try {
      await localPrisma.license.update({
        where: { license_key: licenseKey },
        data: {
          last_validated_at: new Date(),
          offline_validated_at: new Date(), // Also update offline validation time
        },
      });
    } catch (error) {
      console.error('Failed to update license validation time:', error);
    }
  }

  /**
   * Validates license key format (basic validation)
   * You can enhance this with more sophisticated validation
   */
  private isValidLicenseKeyFormat(key: string): boolean {
    // Basic format validation - at least 16 characters
    // You can add more sophisticated validation here
    return key.length >= 16 && /^[A-Za-z0-9\-_]+$/.test(key);
  }

  /**
   * Calculates expiration date from license key
   * This is a placeholder - implement your actual license key parsing logic
   */
  private calculateExpirationDate(licenseKey: string): Date | null {
    // For now, set expiration to 1 year from now
    // In production, parse this from the license key or validate with license server
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    return expirationDate;
  }

  /**
   * Masks license key for logging (security)
   */
  private maskLicenseKey(key: string): string {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
  }

  /**
   * Starts periodic license validation
   */
  startPeriodicValidation(): void {
    if (!this.validationEnabled) return;

    if (this.validationIntervalId) {
      clearInterval(this.validationIntervalId);
    }

    this.validationIntervalId = setInterval(async () => {
      try {
        const result = await this.validateLicense();
        this.cachedValidation = result;
        this.lastValidationTime = new Date();

        if (!result.isValid && result.status !== LicenseStatus.GRACE_PERIOD) {
          console.error('❌ License validation failed:', result.message);
          await ErrorLogger.logSystemError(
            'Periodic license validation failed',
            new Error(result.message),
            'HIGH' as ErrorSeverity,
          );
        }
      } catch (error) {
        console.error('Periodic license validation error:', error);
      }
    }, this.validationInterval);

    console.log(`🔄 Periodic license validation started (every ${this.validationInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stops periodic license validation
   */
  stopPeriodicValidation(): void {
    if (this.validationIntervalId) {
      clearInterval(this.validationIntervalId);
      this.validationIntervalId = null;
    }
  }

  /**
   * Gets cached validation result (for performance)
   */
  getCachedValidation(): LicenseValidationResult | null {
    // Return cached result if it's less than 1 hour old
    if (this.cachedValidation && this.lastValidationTime) {
      const age = Date.now() - this.lastValidationTime.getTime();
      if (age < 3600000) { // 1 hour
        return this.cachedValidation;
      }
    }
    return null;
  }

  /**
   * Gets license information
   */
  async getLicenseInfo(): Promise<LicenseInfo | null> {
    const licenseKey = process.env.LICENSE_KEY;
    if (!licenseKey) return null;

    return await this.getLicenseFromDatabase(licenseKey);
  }
}

// Export singleton instance
export const licenseValidator = new LicenseValidator();

