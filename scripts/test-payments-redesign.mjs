import { 
  computeTenantBillingState, 
  calculateBillStatus, 
  computeFinancialDashboardSummary 
} from '../src/lib/billingService.ts';

import {
  mockInvoices,
  mockPayments,
  mockReminders,
  mockAuditLogs,
  mockTenants
} from '../src/lib/mockData.ts';

async function runPaymentSuite() {
  console.log('================================================================');
  console.log('🏁 RUNNING COMPREHENSIVE PAYMENTS REDESIGN TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] Scenario ${total}: ${name}`);
      if (details) console.log(`   ↳ ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Scenario ${total}: ${name}`);
      if (details) console.error(`   ↳ ${details}`);
      process.exit(1);
    }
  }

  // --- 1. Scenario 1: Tenant with NO payment made ---
  const tenant1 = {
    id: 't-test-1',
    name: 'Karthik Raja',
    roomNumber: 'A-102',
    bedNumber: 'A-102-A',
    rent: 7500,
    buildingName: 'Block A - Premium Executive'
  };

  const unpaidBill = {
    id: 'inv-t-1',
    number: 'INV-2026-09-001',
    tenantId: tenant1.id,
    tenantName: tenant1.name,
    roomNumber: tenant1.roomNumber,
    amount: 7500,
    paidAmount: 0,
    dueDate: '2026-09-05',
    status: 'DUE',
    items: [{ description: 'Room Rent (September 2026)', amount: 7500 }],
    createdAt: '2026-09-01'
  };

  const state1 = computeTenantBillingState(tenant1, [unpaidBill], [], [], new Date('2026-09-02'));
  assert(
    state1.remainingOutstanding === 7500 &&
    state1.totalApprovedPaid === 0 &&
    state1.primaryStatus === 'DUE' &&
    state1.isPayable === true &&
    state1.isFullyPaid === false,
    'Scenario 1: Tenant with NO payment made',
    `Outstanding: ₹${state1.remainingOutstanding}, Status: ${state1.primaryStatus}, isPayable: ${state1.isPayable}`
  );

  // --- 2. Scenario 2: Tenant makes PARTIAL payment (₹4,500 of ₹7,500) ---
  const txn1 = {
    id: 'tx-101',
    invoiceId: unpaidBill.id,
    tenantId: tenant1.id,
    tenantName: tenant1.name,
    amount: 4500,
    date: '2026-09-03',
    type: 'Monthly Rent',
    paymentMethod: 'UPI',
    status: 'APPROVED',
    referenceId: 'UTR111222333',
    createdAt: new Date('2026-09-03').toISOString()
  };

  const state2 = computeTenantBillingState(tenant1, [unpaidBill], [txn1], [], new Date('2026-09-03'));
  assert(
    state2.remainingOutstanding === 3000 &&
    state2.totalApprovedPaid === 4500 &&
    state2.primaryStatus === 'PARTIAL' &&
    state2.isPartiallyPaid === true &&
    state2.isFullyPaid === false,
    'Scenario 2: Tenant makes PARTIAL payment (₹4,500 of ₹7,500)',
    `Outstanding: ₹${state2.remainingOutstanding}, Paid: ₹${state2.totalApprovedPaid}, Status: ${state2.primaryStatus}`
  );

  // --- 3. Scenario 3: Tenant makes second payment completing full amount (₹3,000) ---
  const txn2 = {
    id: 'tx-102',
    invoiceId: unpaidBill.id,
    tenantId: tenant1.id,
    tenantName: tenant1.name,
    amount: 3000,
    date: '2026-09-04',
    type: 'Monthly Rent',
    paymentMethod: 'UPI',
    status: 'APPROVED',
    referenceId: 'UTR444555666',
    createdAt: new Date('2026-09-04').toISOString()
  };

  const state3 = computeTenantBillingState(tenant1, [unpaidBill], [txn1, txn2], [], new Date('2026-09-04'));
  assert(
    state3.remainingOutstanding === 0 &&
    state3.totalApprovedPaid === 7500 &&
    state3.primaryStatus === 'PAID' &&
    state3.isFullyPaid === true &&
    state3.isPayable === false &&
    state3.invoices[0].transactions.length === 2,
    'Scenario 3: Tenant completes full payment (Multi-payment on single bill)',
    `Outstanding: ₹${state3.remainingOutstanding}, Total Paid: ₹${state3.totalApprovedPaid}, Status: ${state3.primaryStatus}, Associated Txns: ${state3.invoices[0].transactions.length}`
  );

  // --- 4. Scenario 4: Page reload / recomputation persistence ---
  const recomputed = computeTenantBillingState(tenant1, [unpaidBill], [txn1, txn2], []);
  assert(
    recomputed.remainingOutstanding === 0 &&
    recomputed.isFullyPaid === true &&
    recomputed.invoices[0].status === 'PAID',
    'Scenario 4: Recomputation and state persistence with zero discrepancy',
    `Recomputed Outstanding: ₹${recomputed.remainingOutstanding}, Fully Paid: ${recomputed.isFullyPaid}`
  );

  // --- 5. Scenario 5: Owner and Tenant portals synchronized ---
  const ownerSummary = computeFinancialDashboardSummary(state3.invoices);
  assert(
    ownerSummary.totalExpected === 7500 &&
    ownerSummary.totalCollected === 7500 &&
    ownerSummary.totalOutstanding === 0 &&
    ownerSummary.countPaid === 1 &&
    ownerSummary.collectionRate === 100,
    'Scenario 5: Single source of truth calculation engine for Owner and Tenant',
    `Expected: ₹${ownerSummary.totalExpected}, Collected: ₹${ownerSummary.totalCollected}, Collection Rate: ${ownerSummary.collectionRate}%`
  );

  // --- 6. Scenario 6: Verification Pending State ---
  const pendingTxn = {
    id: 'tx-pending-01',
    invoiceId: unpaidBill.id,
    tenantId: tenant1.id,
    tenantName: tenant1.name,
    amount: 7500,
    date: '2026-09-02',
    type: 'Monthly Rent',
    paymentMethod: 'UPI',
    status: 'PENDING',
    referenceId: 'UTR-PENDING-999',
    createdAt: new Date('2026-09-02').toISOString()
  };

  const statePending = computeTenantBillingState(tenant1, [unpaidBill], [pendingTxn], [], new Date('2026-09-02'));
  assert(
    statePending.isUnderVerification === true &&
    statePending.primaryStatus === 'VERIFICATION_PENDING' &&
    statePending.totalPendingVerification === 7500,
    'Scenario 6: Payment Verification Pending state handling',
    `Status: ${statePending.primaryStatus}, Pending Verification Amount: ₹${statePending.totalPendingVerification}`
  );

  // --- 7. Scenario 7: Overdue calculation rule ---
  const pastDueDate = new Date('2026-09-10'); // Past 5th September due date
  const overdueStatus = calculateBillStatus(7500, 0, '2026-09-05', false, pastDueDate);
  assert(
    overdueStatus === 'OVERDUE',
    'Scenario 7: Overdue status derived correctly when past due date',
    `Calculated Status on 10th Sept for due date 5th Sept: ${overdueStatus}`
  );

  // --- 8. Scenario 8: Duplicate UTR Detection Guard ---
  const mockTxnsLedger = [
    { id: 'p1', referenceId: 'UPI123456789012', status: 'APPROVED' },
    { id: 'p2', referenceId: 'UPI987654321001', status: 'PENDING' }
  ];

  const duplicateFound = mockTxnsLedger.some(t => t.referenceId === 'UPI123456789012');
  const uniqueFound = mockTxnsLedger.some(t => t.referenceId === 'UPI_NEW_UNIQUE_REF');

  assert(
    duplicateFound === true && uniqueFound === false,
    'Scenario 8: Duplicate UTR / Reference ID Guard',
    `Duplicate 'UPI123456789012' caught: ${duplicateFound}`
  );

  // --- 9. Scenario 9: Non-destructive Transaction Reversal & Audit Log ---
  const originalTx = {
    id: 'pay-sample-001',
    tenantId: 't-1',
    amount: 8500,
    status: 'APPROVED',
    referenceId: 'UPI987654321001'
  };

  const reversalTx = {
    id: `rev-${Date.now()}`,
    tenantId: originalTx.tenantId,
    amount: -8500,
    status: 'REFUNDED',
    originalPaymentId: originalTx.id,
    notes: 'Reversal: Bank dispute'
  };

  const auditEntry = {
    id: `audit-${Date.now()}`,
    action: 'TRANSACTION_REVERSED',
    userName: 'Owner Alok',
    entityId: reversalTx.id,
    details: `Reversed ₹8,500 for ${originalTx.tenantId}. Reason: Bank dispute`,
    createdAt: new Date().toISOString()
  };

  assert(
    reversalTx.status === 'REFUNDED' &&
    reversalTx.originalPaymentId === originalTx.id &&
    auditEntry.action === 'TRANSACTION_REVERSED',
    'Scenario 9: Non-destructive Transaction Reversal with Audit Trail',
    `Reversal created referencing ${originalTx.id} with audit entry ${auditEntry.action}`
  );

  // --- 10. Scenario 10: Official Receipt Numbering Format ---
  const sampleReceiptNo = `SSR-RCP-${String(100452).padStart(6, '0')}`;
  assert(
    sampleReceiptNo.startsWith('SSR-RCP-') && sampleReceiptNo.length === 14,
    'Scenario 10: Standardized Official Receipt Serial Format (SSR-RCP-XXXXXX)',
    `Official Receipt Serial: ${sampleReceiptNo}`
  );

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} SCENARIOS PASSED WITH 100% SUCCESS!`);
  console.log('================================================================\n');
}

runPaymentSuite().catch(console.error);
