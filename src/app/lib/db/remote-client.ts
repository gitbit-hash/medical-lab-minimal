// lib/db/remote-client.ts
import { PrismaClient } from '@prisma/client'
import { getRequiredEnvVar } from '../env-validation'
import { retryWithBackoff } from './retry-helper'

class RemoteDB {
  private prisma: PrismaClient | null = null
  private isConnected = false
  private remoteDatabaseUrl: string

  constructor() {
    // Validate environment variable on instantiation
    this.remoteDatabaseUrl = getRequiredEnvVar('REMOTE_DATABASE_URL')
  }

  async connect() {
    if (this.isConnected && this.prisma) return this.prisma

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.remoteDatabaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

    // Test connection with retry logic
    try {
      await retryWithBackoff(
        async () => {
          await this.prisma!.$queryRaw`SELECT 1`;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 5000,
        }
      );
      this.isConnected = true
    } catch (error) {
      this.prisma = null
      this.isConnected = false
      
      // Log connection error
      const { ErrorLogger } = await import('../error-logger');
      await ErrorLogger.logDatabaseError('Failed to connect to remote database after retries', error, {
        databaseUrl: this.remoteDatabaseUrl.replace(/:[^:@]+@/, ':****@'), // Mask password
      });
      
      throw error
    }

    return this.prisma
  }

  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
      this.isConnected = false
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      await this.connect()
      return true
    } catch {
      return false
    }
  }
}

export const remoteDB = new RemoteDB()