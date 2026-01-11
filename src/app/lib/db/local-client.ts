// lib/db/local-client.ts
import { PrismaClient } from '@prisma/client'
import { getRequiredEnvVar } from '../env-validation'

// Validate environment variable before creating client
let localDatabaseUrl: string;
try {
  localDatabaseUrl = getRequiredEnvVar('LOCAL_DATABASE_URL');
} catch (error) {
  console.error('❌ Failed to initialize local database client:', error);
  throw error;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const localPrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: localDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Add error handling for database connection
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = localPrisma;
  
  // Test connection on startup in development
  localPrisma.$connect()
    .then(() => {
      console.log('✅ Local database connected successfully');
    })
    .catch((error) => {
      console.error('❌ Failed to connect to local database:', error);
      // Import error logger dynamically to avoid circular dependencies
      import('../error-logger').then(({ ErrorLogger }) => {
        ErrorLogger.logDatabaseError('Failed to connect to local database', error, {
          databaseUrl: localDatabaseUrl.replace(/:[^:@]+@/, ':****@'), // Mask password
        });
      });
    });
}