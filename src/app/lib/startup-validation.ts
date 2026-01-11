// lib/startup-validation.ts
/**
 * Startup validation that runs once when the application starts
 * Validates environment variables and critical configurations
 */

import { validateEnvVars } from './env-validation';
import { ErrorLogger, ErrorSeverity } from './error-logger';
import { licenseValidator } from './license/license-validator';

let hasValidated = false;

/**
 * Validates application startup requirements
 * Should be called early in the application lifecycle
 */
export async function validateStartup(): Promise<boolean> {
  // Only validate once
  if (hasValidated) {
    return true;
  }

  try {
    // Validate environment variables
    validateEnvVars();
    
    // Validate license (if enabled)
    const licenseResult = await licenseValidator.validateLicense();
    
    if (!licenseResult.isValid && licenseResult.status !== 'grace_period') {
      const errorMessage = `License validation failed: ${licenseResult.message}`;
      console.error('❌ License Validation Failed:', errorMessage);
      
      // Log error (but don't block if DB is not ready)
      try {
        await ErrorLogger.logSystemError(
          'License validation failed on startup',
          new Error(errorMessage),
          ErrorSeverity.CRITICAL
        );
      } catch (logError) {
        // Ignore logging errors during startup
      }
      
      // In production, you might want to throw here to block startup
      // For now, we'll log and continue (graceful degradation)
      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMessage);
      } else {
        console.warn('⚠️ Continuing in development mode despite license validation failure');
      }
    } else if (licenseResult.status === 'grace_period') {
      console.warn('⚠️ License in grace period:', licenseResult.message);
    } else {
      console.log('✅ License validation passed');
    }
    
    // Start periodic license validation
    licenseValidator.startPeriodicValidation();
    
    hasValidated = true;
    console.log('✅ Startup validation passed');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    console.error('❌ Startup validation failed:', errorMessage);
    
    // Log the error (but don't use database logging since validation might fail before DB is ready)
    console.error('Application cannot start without required environment variables.');
    console.error('Please check your .env file and ensure all required variables are set.');
    
    hasValidated = false;
    return false;
  }
}

/**
 * Validates startup in a non-blocking way (for Next.js layouts)
 * Returns validation result without throwing
 * Now properly blocks the app if license is invalid
 */
export async function validateStartupSafe(): Promise<{ valid: boolean; error?: string; licenseStatus?: string; message?: string }> {
  if (hasValidated) {
    return { valid: true };
  }

  try {
    validateEnvVars();
    
    // Validate license
    const licenseResult = await licenseValidator.validateLicense();
    const licenseStatus = licenseResult.isValid ? 'valid' : licenseResult.status;
    
    // Check if license is valid
    // Allow grace_period to continue (offline mode)
    const isLicenseValid = licenseResult.isValid || licenseResult.status === 'grace_period';
    
    if (!isLicenseValid) {
      // License is invalid - block the app
      const errorMessage = `License validation failed: ${licenseResult.message}`;
      console.error('❌ License Validation Failed:', errorMessage);
      
      // Log error
      try {
        await ErrorLogger.logSystemError(
          'License validation failed on startup',
          new Error(errorMessage),
          ErrorSeverity.CRITICAL
        );
      } catch (logError) {
        // Ignore logging errors during startup
      }
      
      hasValidated = false;
      return { 
        valid: false,
        error: errorMessage,
        licenseStatus: licenseStatus,
        message: licenseResult.message,
      };
    }
    
    // License is valid or in grace period
    if (licenseResult.status === 'grace_period') {
      console.warn('⚠️ License in grace period:', licenseResult.message);
    } else {
      console.log('✅ License validation passed');
    }
    
    // Start periodic validation
    licenseValidator.startPeriodicValidation();
    
    hasValidated = true;
    return { 
      valid: true,
      licenseStatus: licenseStatus,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    console.error('❌ Startup validation error:', errorMessage);
    return { valid: false, error: errorMessage };
  }
}



