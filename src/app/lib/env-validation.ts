// lib/env-validation.ts
/**
 * Validates that all required environment variables are set.
 * Throws an error if any required variable is missing.
 * 
 * This should be called early in the application startup process.
 */

const requiredEnvVars = [
  'LOCAL_DATABASE_URL',
  'REMOTE_DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_BASE_URL',
  'PG_BIN_DIR',
  'PG_DUMP_PATH',
  'PSQL_PATH',
  'SYNC_INTERVAL',
  'LICENSE_VALIDATION_ENABLED',
  'LICENSE_KEY',
  'LICENSE_OFFLINE_GRACE_DAYS',
  'LICENSE_VALIDATION_INTERVAL',
] as const;

type RequiredEnvVar = typeof requiredEnvVars[number];
type OptionalEnvVar = typeof optionalEnvVars[number];

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates all required environment variables
 * @throws Error if any required variable is missing
 */
export function validateEnvVars(): void {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check required variables
  requiredEnvVars.forEach(varName => {
    // NEXTAUTH_URL is required in production, but we can provide a default in development
    if (varName === 'NEXTAUTH_URL' && !process.env[varName] && !isProduction) {
      // Set a default for development
      process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      warnings.push('NEXTAUTH_URL not set, using default: http://localhost:3000 (development only)');
    } else if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional but recommended variables
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    // Use NEXTAUTH_URL as fallback if available
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    warnings.push(`NEXT_PUBLIC_BASE_URL is not set. Using ${baseUrl} as fallback.`);
  }

  // Throw error if any required variables are missing
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('❌ Environment Validation Failed:', errorMessage);
    console.error('\n📝 Please set the following environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    if (missing.includes('NEXTAUTH_URL')) {
      console.error('\n💡 For development, NEXTAUTH_URL defaults to http://localhost:3000');
      console.error('   For production, set NEXTAUTH_URL to your domain (e.g., https://your-domain.com)');
    }
    throw new Error(errorMessage);
  }

  // Log warnings for optional variables
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      console.warn('⚠️ Environment Warning:', warning);
    });
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Validates environment variables and returns a result object instead of throwing
 * Useful for checking without crashing the application
 */
export function validateEnvVarsSafe(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  requiredEnvVars.forEach(varName => {
    // NEXTAUTH_URL is required in production, but we can provide a default in development
    if (varName === 'NEXTAUTH_URL' && !process.env[varName] && !isProduction) {
      // Set a default for development
      process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      warnings.push('NEXTAUTH_URL not set, using default: http://localhost:3000 (development only)');
    } else if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    warnings.push('NEXT_PUBLIC_BASE_URL is not set');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getRequiredEnvVar(name: RequiredEnvVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`DS_ENV_VALIDATION_ERROR: Required environment variable ${name} is not set`);
  }
  return value;
}

export function getOptionalEnvVar(name: OptionalEnvVar, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Gets an optional environment variable as a number with a default value
 */
export function getOptionalEnvVarNumber(name: OptionalEnvVar, defaultValue: number): number {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`⚠️ Environment variable ${name} is not a valid number, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}



