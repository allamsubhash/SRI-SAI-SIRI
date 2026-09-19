import { calculateBillStatus, computeTenantBillingState } from './src/lib/billingService';
import { calculateMonthlyDues } from './src/lib/rentCalculator';

function runTests() {
  console.log("=== PAYMENTS MODULE AUTHORITATIVE LOGIC TEST SUITE ===");
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

  const currentDate = new Date('2026-09-19');
  const futureDueDate = '2026-09-25';
  const pastDueDate = '2026-09-05';

  // TEST 1: Rent ₹7,000, Paid ₹0, Future Due -> DUE / PENDING
  assertEqual(
    calculateBillStatus(7000, 0, futureDueDate, false, currentDate),
    'DUE',
    'Test 1: Due ₹7,000, Paid ₹0, Future Due Date'
  );

  // TEST 2: Rent ₹7,000, Paid ₹3,000, Future Due -> PARTIAL
  assertEqual(
    calculateBillStatus(7000, 3000, futureDueDate, false, currentDate),
    'PARTIAL',
    'Test 2: Due ₹7,000, Paid ₹3,000, Future Due Date'
  );

  // TEST 3: Rent ₹7,000, Paid ₹7,000 -> PAID (Highest Priority)
  assertEqual(
    calculateBillStatus(7000, 7000, futureDueDate, false, currentDate),
    'PAID',
    'Test 3: Due ₹7,000, Paid ₹7,000 (Balance ₹0)'
  );

  // TEST 4: Rent ₹7,000, Pay ₹3,000 + Pay ₹4,000 -> PAID (Balance ₹0)
  assertEqual(
    calculateBillStatus(7000, 3000 + 4000, futureDueDate, false, currentDate),
    'PAID',
    'Test 4: Due ₹7,000, Installments 3000 + 4000 = 7000'
  );

  // TEST 5: Rent ₹7,000, Paid ₹7,000, Past Due Date -> PAID (NOT OVERDUE!)
  assertEqual(
    calculateBillStatus(7000, 7000, pastDueDate, false, currentDate),
    'PAID',
    'Test 5: Due ₹7,000, Paid ₹7,000, Past Due Date (MUST BE PAID)'
  );

  // TEST 6: Rent ₹7,000, Paid ₹3,000, Past Due Date -> OVERDUE
  assertEqual(
    calculateBillStatus(7000, 3000, pastDueDate, false, currentDate),
    'OVERDUE',
    'Test 6: Due ₹7,000, Paid ₹3,000, Past Due Date'
  );

  // TEST 7: Floating Point Precision Normalization (7000 - 3000.00 - 4000.00)
  const floatPaid = 3000.0000001 + 3999.9999999;
  assertEqual(
    calculateBillStatus(7000.00, floatPaid, pastDueDate, false, currentDate),
    'PAID',
    'Test 7: Floating point noise (3000.0000001 + 3999.9999999 = 7000)'
  );

  // TEST 8: rentCalculator Monthly Dues with Partial Invoice Dues
  const mockTenant = { id: 't1', moveInDate: '2026-09-01', rentAmount: 7000 };
  const mockPartialInvoices = [
    { amount: 7000, paidAmount: 3000, dueDate: futureDueDate, status: 'PARTIAL' }
  ];
  const duesResult = calculateMonthlyDues(mockTenant, mockPartialInvoices, currentDate);
  assertEqual(
    duesResult.totalDues,
    4000,
    'Test 8a: Partial invoice dues calculation (7000 total - 3000 paid = 4000 remaining)'
  );
  assertEqual(
    duesResult.status,
    'PARTIAL',
    'Test 8b: Partial invoice billing status derivation'
  );

  // TEST 9: Full Payment Invoice Dues
  const mockPaidInvoices = [
    { amount: 7000, paidAmount: 7000, dueDate: pastDueDate, status: 'PAID' }
  ];
  const paidDuesResult = calculateMonthlyDues(mockTenant, mockPaidInvoices, currentDate);
  assertEqual(
    paidDuesResult.totalDues,
    0,
    'Test 9a: Paid invoice total dues'
  );
  assertEqual(
    paidDuesResult.status,
    'PAID',
    'Test 9b: Paid invoice status'
  );

  // TEST 10: Full Acceptance Step-by-Step Flow (Before Due Date Sept 25)
  console.log("\n--- ACCEPTANCE TEST: Step-by-Step Payment Progression (Future Due Date Sept 25) ---");
  const testTenant = { id: 'TENANT_ACCEPT_1', name: 'Test Tenant', rentAmount: 7000, moveInDate: '2026-09-01' };
  const mockInvoiceSept = [{ id: 'inv-sept', tenantId: 'TENANT_ACCEPT_1', amount: 7000, paidAmount: 0, dueDate: '2026-09-25', billingMonth: 'September 2026' }];
  
  // Step 1: Initial state (No payments)
  let state1 = computeTenantBillingState(testTenant, mockInvoiceSept, [], [], currentDate);
  assertEqual(state1.remainingOutstanding, 7000, 'Step 1: Initial Outstanding is ₹7,000');
  assertEqual(state1.primaryStatus, 'DUE', 'Step 1: Initial Status is DUE before due date');

  // Step 2: Pay ₹2,000
  const payment1 = [{ id: 'p1', tenantId: 'TENANT_ACCEPT_1', amount: 2000, status: 'PAID', type: 'Monthly Rent' }];
  let state2 = computeTenantBillingState(testTenant, mockInvoiceSept, payment1, [], currentDate);
  assertEqual(state2.remainingOutstanding, 5000, 'Step 2: Remaining Outstanding is ₹5,000 after ₹2,000 payment');
  assertEqual(state2.primaryStatus, 'PARTIAL', 'Step 2: Status is PARTIAL');

  // Step 3: Pay ₹3,000 more (Total ₹5,000)
  const payment2 = [
    { id: 'p1', tenantId: 'TENANT_ACCEPT_1', amount: 2000, status: 'PAID', type: 'Monthly Rent' },
    { id: 'p2', tenantId: 'TENANT_ACCEPT_1', amount: 3000, status: 'PAID', type: 'Monthly Rent' }
  ];
  let state3 = computeTenantBillingState(testTenant, mockInvoiceSept, payment2, [], currentDate);
  assertEqual(state3.remainingOutstanding, 2000, 'Step 3: Remaining Outstanding is ₹2,000 after ₹3,000 additional payment');
  assertEqual(state3.primaryStatus, 'PARTIAL', 'Step 3: Status is PARTIAL');

  // Step 4: Pay ₹2,000 final installment (Total ₹7,000)
  const payment3 = [
    { id: 'p1', tenantId: 'TENANT_ACCEPT_1', amount: 2000, status: 'PAID', type: 'Monthly Rent' },
    { id: 'p2', tenantId: 'TENANT_ACCEPT_1', amount: 3000, status: 'PAID', type: 'Monthly Rent' },
    { id: 'p3', tenantId: 'TENANT_ACCEPT_1', amount: 2000, status: 'PAID', type: 'Monthly Rent' }
  ];
  let state4 = computeTenantBillingState(testTenant, mockInvoiceSept, payment3, [], currentDate);
  assertEqual(state4.remainingOutstanding, 0, 'Step 4: Remaining Outstanding is ₹0 after full ₹7,000 payment');
  assertEqual(state4.primaryStatus, 'PAID', 'Step 4: Status is PAID');

  // Step 5: Past due date check when fully paid
  const pastDate = new Date('2026-10-15');
  let state5 = computeTenantBillingState(testTenant, mockInvoiceSept, payment3, [], pastDate);
  assertEqual(state5.primaryStatus, 'PAID', 'Step 5: Status remains PAID even when asOfDate is past due date');

  // TEST 11: Short-Stay Guest Payment Progression
  console.log("\n--- ACCEPTANCE TEST: Short-Stay Guest Flow ---");
  const dailyRate = 600;
  const days = 4;
  const totalStay = dailyRate * days; // 2400
  let guestPaid = 1000;
  let guestBal = totalStay - guestPaid; // 1400
  let guestStatus = calculateBillStatus(totalStay, guestPaid, futureDueDate, false, currentDate);
  assertEqual(guestBal, 1400, 'Short-Stay 1: Balance is ₹1,400 after paying ₹1,000');
  assertEqual(guestStatus, 'PARTIAL', 'Short-Stay 1: Status is PARTIAL');

  guestPaid += 1400; // 2400
  guestBal = Math.max(0, totalStay - guestPaid); // 0
  guestStatus = calculateBillStatus(totalStay, guestPaid, futureDueDate, false, currentDate);
  assertEqual(guestBal, 0, 'Short-Stay 2: Balance is ₹0 after final ₹1,400 payment');
  assertEqual(guestStatus, 'PAID', 'Short-Stay 2: Status is PAID');

  console.log(`\nFinal Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
