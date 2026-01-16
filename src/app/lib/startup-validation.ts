// lib/startup-validation.ts
/**
 * Startup validation that runs once when the application starts
 * Validates environment variables and critical configurations
 */

import { validateEnvVars } from './env-validation';

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

    // No license validation needed anymore
    console.log('✅ Startup validation passed');

    hasValidated = true;
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    console.error('❌ Startup validation failed:', errorMessage);

    // Log the error
    console.error('Application cannot start without required environment variables.');
    console.error('Please check your .env file and ensure all required variables are set.');

    hasValidated = false;
    return false;
  }
}

/**
 * Validates startup in a non-blocking way (for Next.js layouts)
 * Returns validation result without throwing
 */
export async function validateStartupSafe(): Promise<{ valid: boolean; error?: string }> {
  if (hasValidated) {
    return { valid: true };
  }

  try {
    validateEnvVars();

    hasValidated = true;
    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    console.error('❌ Startup validation error:', errorMessage);
    return { valid: false, error: errorMessage };
  }
}



