// lib/error-logger.ts
/**
 * Persistent error logging system
 * Logs system errors, sync failures, and database connection issues
 */

import { localPrisma } from './db/local-client';
import { Prisma } from '@prisma/client';

export enum ErrorCategory {
  DATABASE = 'DATABASE',
  SYNC = 'SYNC',
  API = 'API',
  SYSTEM = 'SYSTEM',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorLogData {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  error?: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Logs an error to the database
   * Falls back to console if database logging fails
   */
  static async logError(data: ErrorLogData): Promise<boolean> {
    const errorLog = {
      category: data.category,
      severity: data.severity,
      message: data.message,
      error: data.error || null,
      stack: data.stack || null,
      context: data.context ? (data.context as Prisma.InputJsonValue) : Prisma.JsonNull,
      user_id: data.userId || null,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      created_at: new Date(),
    };

    // Always log to console first
    this.logToConsole(data);

    // Try to log to database with retries
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Check if error_logs table exists, if not, just use console
        await localPrisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS error_logs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            error TEXT,
            stack TEXT,
            context JSONB,
            user_id TEXT,
            metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);

        // Create indexes if they don't exist
        await localPrisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS error_logs_category_idx ON error_logs(category);
          CREATE INDEX IF NOT EXISTS error_logs_severity_idx ON error_logs(severity);
          CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at);
        `);

        // Insert error log using raw SQL since we're creating the table dynamically
        await localPrisma.$executeRawUnsafe(`
          INSERT INTO error_logs (category, severity, message, error, stack, context, user_id, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, 
          errorLog.category,
          errorLog.severity,
          errorLog.message,
          errorLog.error,
          errorLog.stack,
          JSON.stringify(errorLog.context),
          errorLog.user_id,
          JSON.stringify(errorLog.metadata),
          errorLog.created_at
        );

        return true;
      } catch (dbError) {
        // If database logging fails, log to console
        console.error(`❌ Failed to log error to database (attempt ${attempt}/${this.MAX_RETRIES}):`, dbError);
        
        if (attempt < this.MAX_RETRIES) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        } else {
          // Final attempt failed, log to console only
          console.error('❌ Error logging to database failed after all retries. Error details:', errorLog);
        }
      }
    }

    return false;
  }

  /**
   * Logs error to console with appropriate formatting
   */
  private static logToConsole(data: ErrorLogData): void {
    const prefix = this.getSeverityPrefix(data.severity);
    const timestamp = new Date().toISOString();
    
    console.error(`${prefix} [${timestamp}] [${data.category}] ${data.message}`);
    
    if (data.error) {
      console.error(`   Error: ${data.error}`);
    }
    
    if (data.stack) {
      console.error(`   Stack: ${data.stack}`);
    }
    
    if (data.context && Object.keys(data.context).length > 0) {
      console.error(`   Context:`, data.context);
    }
  }

  /**
   * Gets emoji prefix based on severity
   */
  private static getSeverityPrefix(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🔴';
      case ErrorSeverity.HIGH:
        return '🟠';
      case ErrorSeverity.MEDIUM:
        return '🟡';
      case ErrorSeverity.LOW:
        return '🔵';
      default:
        return '⚪';
    }
  }

  /**
   * Convenience methods for common error types
   */

  static async logDatabaseError(
    message: string,
    error: Error | unknown,
    context?: Record<string, any>
  ): Promise<boolean> {
    return this.logError({
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    });
  }

  static async logSyncError(
    message: string,
    error: Error | unknown,
    context?: Record<string, any>
  ): Promise<boolean> {
    return this.logError({
      category: ErrorCategory.SYNC,
      severity: ErrorSeverity.MEDIUM,
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    });
  }

  static async logApiError(
    message: string,
    error: Error | unknown,
    context?: Record<string, any>
  ): Promise<boolean> {
    return this.logError({
      category: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM,
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    });
  }

  static async logSystemError(
    message: string,
    error: Error | unknown,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    context?: Record<string, any>
  ): Promise<boolean> {
    return this.logError({
      category: ErrorCategory.SYSTEM,
      severity,
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    });
  }

  static async logValidationError(
    message: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    return this.logError({
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      message,
      context,
    });
  }
}

export const errorLogger = new ErrorLogger();
export { ErrorLogger };



