import { dbService } from '../src/lib/db';
import { 
  computeTenantBillingState, 
  calculateBillStatus, 
  computeFinancialDashboardSummary 
} from '../src/lib/billingService';

async function runAllPaymentTests() {
  console.log('================================================================');
  console.log('🏁 STARTING COMPREHENSIVE PAYMENTS REDESIGN TEST SUITE (10 SCENARIOS)');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] Scenario ${totalTests}: ${testName}`);
      if (details) console.log(`   ↳ ${details}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Scenario ${totalTests}: ${testName}`);
      if (details) console.error(`   ↳ Failed details: ${details}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Setup mock test tenant
  const testTenant = {
    id: 'test-tenant-100',
    name: 'Ananya Sharma',
    roomNumber: 'A-201',
    bedNumber: 'A-201-A',
    buildingName: 'Block A - Premium Executive',
    buildingId: 'b-1',
    email: 'ananya@example.com',
    phone: '+91 9876543210',
    rent: 8000
  };

  const initialBill = {
    id: 'inv-test-100',
    number: 'INV-2026-09-100',
    tenantId: testTenant.id,
    tenantName: testTenant.name,
    roomNumber: testTenant.roomNumber,
    amount: 8000,
    paidAmount: 0,
    dueDate: '2026-09-05',
    status: 'DUE',
    items: [{ description: 'Monthly Room Rent (September 2026)', amount: 8000 }],
    dateCreated: '2026-09-01'
  };

  // -------------------------------------------------------------
  // SCENARIO 1: Tenant with NO payment made
  // -------------------------------------------------------------
  const state1 = computeTenantBillingState(testTenant, [initialBill], [], [], new Date('2026-09-02'));
  assert(
    state1.remainingOutstanding === 8000 && 
    state1.totalApprovedPaid === 0 && 
    state1.primaryStatus === 'DUE' && 
    state1.isPayable === true && 
    state1.isFullyPaid === false,
    'Tenant with NO payment made (Unpaid Due)',
    `Outstanding = ₹${state1.remainingOutstanding}, Status = ${state1.primaryStatus}, Payable = ${state1.isPayable}`
  );

  // -------------------------------------------------------------
  // SCENARIO 2: Tenant makes PARTIAL payment (₹5,000 of ₹8,000)
  // -------------------------------------------------------------
  const payment1 = {
    id: 'pay-tx-001',
    invoiceId: initialBill.id,
    tenantId: testTenant.id,
    tenantName: testTenant.name,
    amount: 5000,
    date: '2026-09-03',
    type: 'Monthly Rent',
    paymentMethod: 'UPI',
    status: 'APPROVED' as const,
    referenceId: 'UTR112233445566',
    notes: 'Advance part payment',
    recordedBy: 'Warden',
    createdAt: new Date('2026-09-03').toISOString()
  };

  const state2 = computeTenantBillingState(testTenant, [initialBill], [payment1], [], new Date('2026-09-03'));
  assert(
    state2.remainingOutstanding === 3000 && 
    state2.totalApprovedPaid === 5000 && 
    state2.primaryStatus === 'PARTIAL' && 
    state2.isPartiallyPaid === true && 
    state2.isFullyPaid === false,
    'Tenant makes PARTIAL payment (₹5,000 of ₹8,000)',
    `Outstanding = ₹${state2.remainingOutstanding}, Paid = ₹${state2.totalApprovedPaid}, Status = ${state2.primaryStatus}`
  );

  // -------------------------------------------------------------
  // SCENARIO 3: Tenant completes remaining balance (₹3,000) -> PAID
  // -------------------------------------------------------------
  const payment2 = {
    id: 'pay-tx-002',
    invoiceId: initialBill.id,
    tenantId: testTenant.id,
    tenantName: testTenant.name,
    amount: 3000,
    date: '2026-09-04',
    type: 'Monthly Rent',
    paymentMethod: 'UPI',
    status: 'APPROVED' as const,
    referenceId: 'UTR998877665544',
    notes: 'Remaining balance payment',
    recordedBy: 'Owner',
    createdAt: new Date('2026-09-04').toISOString()
  };

  const state3 = computeTenantBillingState(testTenant, [initialBill], [payment1, payment2], [], new Date('2026-09-04'));
  assert(
    state3.remainingOutstanding === 0 && 
    state3.totalApprovedPaid === 8000 && 
    state3.primaryStatus === 'PAID' && 
    state3.isFullyPaid === true && 
    state3.isPayable === false &&
    state3.invoices[0].transactions.length === 2,
    'Tenant makes second payment completing full amount (₹3,000)',
    `Outstanding = ₹${state3.remainingOutstanding}, Total Paid = ₹${state3.totalApprovedPaid}, Status = ${state3.primaryStatus}, Transactions = ${state3.invoices[0].transactions.length}`
  );

  // -------------------------------------------------------------
  // SCENARIO 4: Calculation Persistence and Multi-Payment Association
  // -------------------------------------------------------------
  const recalculatedState = computeTenantBillingState(testTenant, [initialBill], [payment1, payment2], []);
  assert(
    recalculatedState.remainingOutstanding === 0 && 
    recalculatedState.invoices[0].status === 'PAID' &&
    recalculatedState.invoices[0].paidAmount === 8000,
    'Page Reload / Re-computation Persistence',
    'Re-computed state matches previous state with zero discrepancy'
  );

  // -------------------------------------------------------------
  // SCENARIO 5: Owner and Tenant Sync Engine
  // -------------------------------------------------------------
  // Test that computeFinancialDashboardSummary aggregates the exact same bills
  const dashboardSummary = computeFinancialDashboardSummary(state3.invoices);
  assert(
    dashboardSummary.totalExpected === 8000 && 
    dashboardSummary.totalCollected === 8000 && 
    dashboardSummary.totalOutstanding === 0 && 
    dashboardSummary.countPaid === 1 && 
    dashboardSummary.collectionRate === 100,
    'Owner and Tenant Portals Share Authoritative Sync Engine',
    `Total Expected = ₹${dashboardSummary.totalExpected}, Total Collected = ₹${dashboardSummary.totalCollected}, Paid Count = ${dashboardSummary.countPaid}`
  );

  // -------------------------------------------------------------
  // SCENARIO 6: Duplicate Payment Submission Guard (Duplicate UTR)
  // -------------------------------------------------------------
  const submitResult1 = await dbService.submitTenantPayment({
    tenantId: 't-1',
    amount: 1000,
    paymentMethod: 'UPI',
    referenceId: 'UNIQUE-UTR-99999',
    notes: 'First submission'
  });

  let duplicateCaught = false;
  try {
    await dbService.submitTenantPayment({
      tenantId: 't-1',
      amount: 1000,
      paymentMethod: 'UPI',
      referenceId: 'UNIQUE-UTR-99999',
      notes: 'Duplicate attempt'
    });
  } catch (err: any) {
    duplicateCaught = err.message.includes('already been submitted') || err.message.includes('Duplicate');
  }

  assert(
    submitResult1.success === true && duplicateCaught === true,
    'Duplicate UTR Payment Submission Guard',
    'Second submission with identical UTR was correctly intercepted and rejected'
  );

  // -------------------------------------------------------------
  // SCENARIO 7: Reminder Engine Stops after Full Settlement (₹0 Outstanding)
  // -------------------------------------------------------------
  let reminderBlocked = false;
  try {
    // inv-1 in mockData is PAID
    await dbService.sendPaymentReminder({
      invoiceId: 'inv-1',
      reminderType: 'Overdue',
      channel: 'WhatsApp'
    });
  } catch (err: any) {
    reminderBlocked = err.message.includes('already fully paid') || err.message.includes('Outstanding: ₹0');
  }

  assert(
    reminderBlocked === true,
    'Reminder Engine Blocks Reminders for Fully Paid Bills',
    'System rejected sending reminder for settled invoice'
  );

  // -------------------------------------------------------------
  // SCENARIO 8: Official Payment Receipt Integrity
  // -------------------------------------------------------------
  const recordedPay = await dbService.recordPayment({
    invoiceId: 'inv-4',
    tenantId: 't-4',
    amount: 6500,
    paymentMethod: 'UPI',
    referenceId: 'UTR-OFFICIAL-REC-001',
    recordedBy: 'Owner Alok'
  });

  assert(
    recordedPay.receiptNumber.startsWith('SSR-RCP-') &&
    recordedPay.status === 'APPROVED' &&
    recordedPay.amount === 6500,
    'Official Receipt Generation with SSR-RCP Serial',
    `Generated Receipt No: ${recordedPay.receiptNumber}`
  );

  // -------------------------------------------------------------
  // SCENARIO 9: Non-destructive Transaction Reversal with Audit Trail
  // -------------------------------------------------------------
  const reversal = await dbService.reverseTransaction({
    paymentId: recordedPay.id,
    reason: 'Bank chargeback requested by tenant bank',
    reversedBy: 'Owner Alok'
  });

  assert(
    reversal.success === true &&
    reversal.reversal.status === 'REFUNDED' &&
    reversal.reversal.originalPaymentId === recordedPay.id,
    'Non-destructive Transaction Reversal with Audit Trail',
    `Reversal transaction created: ${reversal.reversal.id}, referencing original ${reversal.reversal.originalPaymentId}`
  );

  // -------------------------------------------------------------
  // SCENARIO 10: Multi-Filter / Slicers Workspace Querying
  // -------------------------------------------------------------
  const workspaceFiltered = await dbService.getPaymentsWorkspace({
    buildingId: 'b-1',
    status: 'ALL'
  });

  assert(
    workspaceFiltered.bills.length > 0 &&
    workspaceFiltered.bills.every(b => b.roomNumber.startsWith('A') || b.buildingId === 'b-1'),
    'Multi-Filter Slicers Querying (Building / Slicers)',
    `Filtered workspace returned ${workspaceFiltered.bills.length} bills accurately matching Block A criteria`
  );

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} SCENARIOS PASSED WITH ZERO ERRORS!`);
  console.log('================================================================\n');
}

runAllPaymentTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
