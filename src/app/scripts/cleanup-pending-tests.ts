import { localPrisma } from '../lib/db/local-client';

async function cleanupOrphanedTests() {
  console.log('🧹 Cleaning up tests from deleted patients...');

  // Find tests that belong to deleted patients but aren't marked as deleted themselves
  const orphanedTests = await localPrisma.test.findMany({
    where: {
      is_deleted: false,
      patient: {
        is_deleted: true
      }
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          is_deleted: true
        }
      }
    }
  });

  console.log(`📊 Found ${orphanedTests.length} tests from deleted patients`);

  if (orphanedTests.length > 0) {
    console.log('📋 Orphaned tests details:');
    orphanedTests.forEach(test => {
      console.log(`   - Test: ${test.test_type} (${test.id}) -> Patient: ${test.patient.name} (deleted: ${test.patient.is_deleted})`);
    });

    // Soft delete the orphaned tests
    const result = await localPrisma.test.updateMany({
      where: {
        is_deleted: false,
        patient: {
          is_deleted: true
        }
      },
      data: {
        is_deleted: true,
        sync_status: 'Pending',
      },
    });

    console.log(`✅ Soft deleted ${result.count} orphaned tests`);
  } else {
    console.log('✅ No orphaned tests found');
  }

  // Verify cleanup
  const remainingOrphanedTests = await localPrisma.test.count({
    where: {
      is_deleted: false,
      patient: {
        is_deleted: true
      }
    }
  });

  console.log(`🔍 Remaining orphaned tests: ${remainingOrphanedTests}`);
}

cleanupOrphanedTests()
  .catch(console.error)
  .finally(() => {
    console.log('🏁 Cleanup script finished');
    process.exit();
  });