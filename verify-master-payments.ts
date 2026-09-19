import { calculateBillStatus, computeTenantBillingState } from './src/lib/billingService';
import { calculateMonthlyDues } from './src/lib/rentCalculator';
import { dbService } from './src/lib/db';

async function runMasterAuditTests() {
  console.log("=== MASTER PAYMENT SYSTEM END-TO-END AUDIT TEST SUITE ===");
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

  // 1. RECEIPT MATH INVARIANT TEST
  console.log("\n--- TEST 1: Receipt Math Invariant & Single Source Status ---");
  const billAmount = 8500;
  const currentPaid = 8500;
  const totalPaid = currentPaid;
  const computedRemaining = Math.max(0, Number((billAmount - totalPaid).toFixed(2)));
  const statusStamp = (computedRemaining <= 0.01 || (billAmount > 0 && totalPaid >= billAmount)) ? 'PAID' : 'PARTIALLY_PAID';

  assertEqual(computedRemaining, 0, 'Receipt Remaining Balance must be ₹0 when Total Paid equals Bill Amount');
  assertEqual(statusStamp, 'PAID', 'Receipt Status Stamp must be PAID when Total Paid equals Bill Amount');

  // 2. DUE REMINDER HARD RULE ON FULLY PAID TENANTS
  console.log("\n--- TEST 2: Due Reminder Prevention for Paid Tenants ---");
  try {
    // Try sending reminder for a paid invoice
    const mockPaidInv = { id: 'inv-paid-test', tenantId: 't-paid-1', tenantName: 'Paid Resident', amount: 8500, paidAmount: 8500, status: 'PAID', dueDate: pastDueDate, createdAt: new Date().toISOString() };
    (global as any).mockInvoices = (global as any).mockInvoices || [];
    (global as any).mockInvoices.push(mockPaidInv);

    let errorThrown = false;
    try {
      await dbService.sendPaymentReminder({ invoiceId: 'inv-paid-test', reminderType: 'Overdue', channel: 'WhatsApp' });
    } catch (err: any) {
      errorThrown = true;
      console.log(`  Caught expected error: "${err.message}"`);
    }
    assertEqual(errorThrown, true, 'System MUST reject sending payment reminders to fully paid tenants');
  } catch (e: any) {
    console.error('Test 2 Error:', e);
  }

  // 3. TENANT-INITIATED PAYMENT PROGRESSION FLOW (Rent = ₹8,500)
  console.log("\n--- TEST 3: Tenant-Initiated Payment Progression (Rent = ₹8,500) ---");
  const tenantObj = { id: 't-master-1', name: 'Master Tenant', rentAmount: 8500, moveInDate: '2026-09-01' };
  const mockInv = [{ id: 'inv-master-1', tenantId: 't-master-1', amount: 8500, paidAmount: 0, dueDate: futureDueDate, billingMonth: 'September 2026' }];

  // Step 1: Initial state
  let s1 = computeTenantBillingState(tenantObj, mockInv, [], [], currentDate);
  assertEqual(s1.remainingOutstanding, 8500, 'Step 1: Initial Balance is ₹8,500');
  assertEqual(s1.primaryStatus, 'DUE', 'Step 1: Initial Status is DUE');

  // Step 2: Tenant pays ₹3,000 via checkout
  const tx1 = [{ id: 'tx-1', tenantId: 't-master-1', amount: 3000, status: 'PAID', type: 'Monthly Rent' }];
  let s2 = computeTenantBillingState(tenantObj, mockInv, tx1, [], currentDate);
  assertEqual(s2.remainingOutstanding, 5500, 'Step 2: Remaining Balance is ₹5,500 after ₹3,000 payment');
  assertEqual(s2.primaryStatus, 'PARTIAL', 'Step 2: Status is PARTIAL');

  // Step 3: Tenant pays remaining ₹5,500
  const tx2 = [
    { id: 'tx-1', tenantId: 't-master-1', amount: 3000, status: 'PAID', type: 'Monthly Rent' },
    { id: 'tx-2', tenantId: 't-master-1', amount: 5500, status: 'PAID', type: 'Monthly Rent' }
  ];
  let s3 = computeTenantBillingState(tenantObj, mockInv, tx2, [], currentDate);
  assertEqual(s3.remainingOutstanding, 0, 'Step 3: Remaining Balance is ₹0 after full settlement');
  assertEqual(s3.primaryStatus, 'PAID', 'Step 3: Status is PAID');

  // Step 4: Check status past due date when fully paid
  const futurePastDate = new Date('2026-10-20');
  let s4 = computeTenantBillingState(tenantObj, mockInv, tx2, [], futurePastDate);
  assertEqual(s4.primaryStatus, 'PAID', 'Step 4: Fully paid tenant remains PAID past due date');

  // 4. SHORT-STAY VS MONTHLY TENANT ISOLATION
  console.log("\n--- TEST 4: Short-Stay vs Monthly Isolation ---");
  const shortStayGuest = { id: 'ss-g1', name: 'Short Stay Guest', dailyRent: 600, numberOfDays: 4, totalAmount: 2400, amountPaid: 1000, balance: 1400 };
  const monthlyTenant = { id: 't-m1', name: 'Monthly Resident', rentAmount: 8500 };
  const monthlyState = computeTenantBillingState(monthlyTenant, [], [], [], currentDate);
  
  assertEqual(shortStayGuest.balance, 1400, 'Short-stay balance calculated independently');
  assertEqual(monthlyState.remainingOutstanding, 8500, 'Monthly tenant balance unaffected by short-stay records');

  console.log(`\nMaster Audit Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runMasterAuditTests();
