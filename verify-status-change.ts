import { dbService } from './src/lib/db';
import { calculateBillStatus } from './src/lib/billingService';

async function testStatusChange() {
  console.log("=== PAYMENT STATUS CHANGE AUTOMATED TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assertEqual(actual: any, expected: any, testName: string) {
    if (actual === expected) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - Expected: "${expected}", Got: "${actual}"`);
      failed++;
    }
  }

  // TEST 1: Change status to PAID
  console.log("\n--- TEST 1: Update status to PAID ---");
  const res1 = await dbService.updateInvoiceStatus('inv-test-1', 'PAID', 'Owner', 't-test-1');
  assertEqual(res1.success, true, 'API returns success flag when setting status to PAID');
  assertEqual(res1.status, 'PAID', 'Returned status is PAID');

  const summary1 = await dbService.getTenantFinancialSummary('t-test-1');
  assertEqual(summary1.paymentStatus, 'PAID', 'Tenant billing summary paymentStatus updated to PAID');
  assertEqual(summary1.outstandingAmount, 0, 'Tenant outstanding amount updated to ₹0 upon PAID status change');

  // TEST 2: Change status to OVERDUE
  console.log("\n--- TEST 2: Update status to OVERDUE ---");
  const res2 = await dbService.updateInvoiceStatus('inv-test-2', 'OVERDUE', 'Owner', 't-test-2');
  assertEqual(res2.success, true, 'API returns success flag when setting status to OVERDUE');
  assertEqual(res2.status, 'OVERDUE', 'Returned status is OVERDUE');

  // TEST 3: Change status to DUE
  console.log("\n--- TEST 3: Update status to PENDING/DUE ---");
  const res3 = await dbService.updateInvoiceStatus('inv-test-3', 'PENDING', 'Owner', 't-test-3');
  assertEqual(res3.success, true, 'API returns success flag when setting status to PENDING');
  assertEqual(res3.status, 'DUE', 'Normalized status is DUE');

  console.log(`\nStatus Change Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

testStatusChange();
