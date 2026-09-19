import { getTenantCurrentRent } from './rentCalculator';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE' | 'VERIFICATION_PENDING';

export interface PaymentTransaction {
  id: string;
  invoiceId?: string;
  tenantId: string;
  tenantName?: string;
  roomNumber?: string;
  buildingName?: string;
  amount: number;
  date: string;
  type: string; // 'Monthly Rent' | 'Security Deposit' | 'Advance' | 'Mess/Food' | 'Electricity' | 'Maintenance' | 'Other Charges' | 'Refund' | 'Reversal'
  paymentMethod: string; // 'UPI' | 'Cash' | 'Bank Transfer' | 'Card' | 'Other'
  status: 'PAID' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'REVERSED';
  referenceId?: string;
  screenshotUrl?: string;
  notes?: string;
  recordedBy?: string;
  rejectionReason?: string;
  originalPaymentId?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface ReminderRecord {
  id: string;
  invoiceId: string;
  tenantId: string;
  type: 'Upcoming Due' | 'Due Today' | 'Overdue' | 'Manual Reminder';
  channel: 'WhatsApp' | 'SMS' | 'Portal' | 'Email';
  sentAt: string;
  sentBy: string;
  status: 'SENT' | 'DELIVERED';
}

export interface FinancialAuditLog {
  id: string;
  action: string;
  userId?: string;
  userName: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export interface UnifiedBill {
  id: string;
  number: string;
  tenantId: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  roomNumber: string;
  bedNumber?: string;
  buildingId?: string;
  buildingName: string;
  billingMonth: string;
  billingPeriod: string;
  billType: string;
  amount: number; // Total charged
  paidAmount: number; // Sum of approved/paid transactions
  outstandingAmount: number; // max(0, amount - paidAmount)
  dueDate: string;
  status: PaymentStatus;
  items: { description: string; amount: number }[];
  itemsJson?: string;
  transactions: PaymentTransaction[];
  reminders: ReminderRecord[];
  pendingVerificationCount: number;
  lastPaymentDate?: string;
  dateCreated: string;
}

export interface UnifiedTenantBillingState {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  bedNumber: string;
  buildingName: string;
  monthlyRent: number;
  moveInDate: string;
  
  totalExpectedRent: number;
  totalApprovedPaid: number;
  totalPendingVerification: number;
  remainingOutstanding: number;
  totalDues: number;
  
  dueDate: string;
  primaryStatus: PaymentStatus;
  
  isPayable: boolean;
  isUnderVerification: boolean;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  isOverdue: boolean;
  
  currentBill: UnifiedBill | null;
  invoices: UnifiedBill[];
  payments: PaymentTransaction[];
}

/**
 * Calculates payment status for an individual bill using strict mathematical and date rules.
 * 
 * Rules:
 * - Outstanding = Bill Amount - Sum(Valid Payments)
 * - If Outstanding <= 0 -> PAID
 * - If has unapproved pending verification submission -> VERIFICATION_PENDING
 * - If Paid > 0 and Outstanding > 0 -> PARTIAL
 * - If Outstanding > 0 and asOfDate <= dueDate -> DUE
 * - If Outstanding > 0 and asOfDate > dueDate -> OVERDUE
 */
export function calculateBillStatus(
  amount: number,
  paidAmount: number,
  dueDateStr: string,
  hasPendingVerification: boolean = false,
  asOfDate: Date = new Date()
): PaymentStatus {
  const outstanding = Math.max(0, amount - paidAmount);

  // RULE 1: If Outstanding <= 0 -> ALWAYS PAID
  if (outstanding <= 0) {
    return 'PAID';
  }

  // RULE 2: If Has Pending Verification Submission -> VERIFICATION_PENDING
  if (hasPendingVerification) {
    return 'VERIFICATION_PENDING';
  }

  // Check Due Date
  const dueDate = new Date(dueDateStr);
  let isPastDueDate = false;
  if (!isNaN(dueDate.getTime())) {
    const endOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59);
    isPastDueDate = asOfDate > endOfDueDate;
  }

  // RULE 3: If Outstanding > 0 and Due Date passed -> OVERDUE (whether partial or 0 paid)
  if (isPastDueDate) {
    return 'OVERDUE';
  }

  // RULE 4: If Outstanding > 0, Due Date NOT passed, and Paid > 0 -> PARTIAL
  if (paidAmount > 0) {
    return 'PARTIAL';
  }

  // RULE 5: If Outstanding > 0, Due Date NOT passed, and Paid = 0 -> DUE
  return 'DUE';
}

/**
 * Normalizes string helpers
 */
function normalizeName(str?: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Single Authoritative Billing Service for Sri Sai Siri Boys Hostel ERP.
 * 
 * Computes single source of truth billing metrics for any tenant.
 * Used by Owner Portal, Tenant Portal, APIs, and Dashboards.
 */
export function computeTenantBillingState(
  tenant: any,
  rawInvoices: any[] = [],
  rawPayments: any[] = [],
  rawReminders: any[] = [],
  asOfDate: Date = new Date()
): UnifiedTenantBillingState {
  const monthlyRent = getTenantCurrentRent(tenant);
  const tenantId = tenant?.id || tenant?.userId || 'unknown';
  const tenantName = tenant?.name || tenant?.profile?.name || (tenant?.profile ? `${tenant.profile.firstName} ${tenant.profile.lastName}`.trim() : 'Resident');
  const roomNumber = tenant?.roomNumber || 'A-101';
  const bedNumber = tenant?.bedNumber || 'A';
  const buildingName = tenant?.building?.name || tenant?.buildingName || (roomNumber.startsWith('B') ? 'Block B - Classic Standard' : 'Block A - Premium Executive');
  const moveInDate = tenant?.moveInDate || tenant?.joiningDate || '2026-01-15';
  const tenantEmail = tenant?.email || tenant?.profile?.user?.email || '';
  const tenantPhone = tenant?.phone || tenant?.profile?.phone || '';

  const normTenantName = normalizeName(tenantName);

  // 1. Filter transactions belonging to this tenant
  const tenantPayments: PaymentTransaction[] = (rawPayments || [])
    .filter((p: any) => {
      if (p.tenantId === tenantId) return true;
      if (tenant.userId && (p.tenantId === tenant.userId || p.userId === tenant.userId)) return true;
      if (p.tenantName && normTenantName && normalizeName(p.tenantName) === normTenantName) return true;
      return false;
    })
    .map((p: any) => ({
      id: p.id,
      invoiceId: p.invoiceId || undefined,
      tenantId: p.tenantId || tenantId,
      tenantName: p.tenantName || tenantName,
      roomNumber: p.roomNumber || roomNumber,
      buildingName: p.buildingName || buildingName,
      amount: Number(p.amount) || 0,
      date: p.date ? (typeof p.date === 'string' ? p.date.split('T')[0] : new Date(p.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      type: p.type || 'Monthly Rent',
      paymentMethod: p.paymentMethod || 'UPI',
      status: (p.status || 'PAID') as any,
      referenceId: p.referenceId || undefined,
      screenshotUrl: p.screenshotUrl || undefined,
      notes: p.notes || undefined,
      recordedBy: p.recordedBy || 'Manager',
      rejectionReason: p.rejectionReason || undefined,
      originalPaymentId: p.originalPaymentId || undefined,
      receiptNumber: p.receiptNumber || `SSR-RCP-${p.id ? String(p.id).replace(/[^0-9]/g, '').slice(-6).padStart(6, '0') : '000182'}`,
      createdAt: p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString()) : new Date().toISOString()
    }));

  // 2. Filter invoices belonging to this tenant
  let tenantInvoicesRaw = (rawInvoices || []).filter((inv: any) => {
    if (inv.tenantId === tenantId) return true;
    if (tenant.userId && (inv.tenantId === tenant.userId || inv.userId === tenant.userId)) return true;
    if (inv.tenantName && normTenantName && normalizeName(inv.tenantName) === normTenantName) return true;
    return false;
  });

  // Current month string representation (e.g. "September 2026")
  const currentMonthStr = asOfDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // If no invoice exists, generate a standard authoritative invoice for current month
  if (tenantInvoicesRaw.length === 0) {
    const dueDateStr = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 5).toISOString().split('T')[0];
    tenantInvoicesRaw = [{
      id: `inv-${tenantId}`,
      number: `INV-${asOfDate.getFullYear()}-${String(asOfDate.getMonth() + 1).padStart(2, '0')}-${String(tenantId).replace(/[^0-9]/g, '').slice(-3) || '001'}`,
      tenantId: tenantId,
      tenantName: tenantName,
      roomNumber: roomNumber,
      amount: monthlyRent,
      paidAmount: 0,
      dueDate: dueDateStr,
      billingMonth: currentMonthStr,
      itemsJson: JSON.stringify([{ description: `Monthly Hostel Rent - ${currentMonthStr}`, amount: monthlyRent }]),
      createdAt: new Date().toISOString()
    }];
  }

  // 3. Associate transactions and reminders with each bill
  const unifiedBills: UnifiedBill[] = tenantInvoicesRaw.map((inv: any) => {
    let itemsList: any[] = [];
    try {
      if (Array.isArray(inv.items)) itemsList = inv.items;
      else if (typeof inv.itemsJson === 'string') itemsList = JSON.parse(inv.itemsJson);
      if (!Array.isArray(itemsList)) itemsList = (itemsList as any)?.items || [];
    } catch {
      itemsList = [];
    }

    if (itemsList.length === 0) {
      itemsList = [{ description: `Monthly Hostel Rent (${inv.billingMonth || currentMonthStr})`, amount: Number(inv.amount) || monthlyRent }];
    }

    // Find all transactions specifically linked to this invoice or belonging to the tenant
    const billTransactions = tenantPayments.filter((p) => {
      if (p.invoiceId && p.invoiceId === inv.id) return true;
      if (!p.invoiceId) {
        return true;
      }
      return false;
    });

    // Valid payments are APPROVED or PAID
    const approvedTxns = billTransactions.filter((p) => p.status === 'APPROVED' || p.status === 'PAID');
    const validPaidSum = approvedTxns.reduce((sum, p) => sum + p.amount, 0);

    const pendingTxns = billTransactions.filter((p) => p.status === 'PENDING');
    const hasPendingVerification = pendingTxns.length > 0;

    const totalBillAmount = Number(inv.amount) || monthlyRent;
    const effectivePaidAmount = Math.min(totalBillAmount, Math.max(Number(inv.paidAmount) || 0, validPaidSum));
    const outstanding = Math.max(0, totalBillAmount - effectivePaidAmount);

    const dueDateStr = inv.dueDate 
      ? (typeof inv.dueDate === 'string' ? inv.dueDate.split('T')[0] : new Date(inv.dueDate).toISOString().split('T')[0])
      : new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 5).toISOString().split('T')[0];

    const computedStatus = calculateBillStatus(totalBillAmount, effectivePaidAmount, dueDateStr, hasPendingVerification, asOfDate);

    // Bill reminders
    const billReminders = (rawReminders || []).filter((r: any) => r.invoiceId === inv.id || r.tenantId === tenantId);

    const billingPeriod = inv.billingMonth || currentMonthStr;

    return {
      id: inv.id,
      number: inv.number || `INV-${String(inv.id).slice(-6).toUpperCase()}`,
      tenantId: tenantId,
      tenantName: tenantName,
      tenantEmail,
      tenantPhone,
      roomNumber: inv.roomNumber || roomNumber,
      bedNumber: tenant?.bedNumber || bedNumber,
      buildingId: tenant?.buildingId,
      buildingName: buildingName,
      billingMonth: billingPeriod,
      billingPeriod: billingPeriod,
      billType: inv.type || 'Monthly Rent',
      amount: totalBillAmount,
      paidAmount: effectivePaidAmount,
      outstandingAmount: outstanding,
      dueDate: dueDateStr,
      status: computedStatus,
      items: itemsList,
      itemsJson: inv.itemsJson || JSON.stringify(itemsList),
      transactions: billTransactions,
      reminders: billReminders,
      pendingVerificationCount: pendingTxns.length,
      lastPaymentDate: approvedTxns.length > 0 ? approvedTxns[0].date : undefined,
      dateCreated: inv.createdAt ? (typeof inv.createdAt === 'string' ? inv.createdAt.split('T')[0] : new Date(inv.createdAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    };
  });

  // Sort bills by creation date descending
  unifiedBills.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Aggregate Tenant-Level Metrics
  const totalExpectedRent = unifiedBills.reduce((sum, b) => sum + b.amount, 0);
  const totalApprovedPaid = unifiedBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const remainingOutstanding = Math.max(0, totalExpectedRent - totalApprovedPaid);

  const pendingVerificationTxns = tenantPayments.filter((p) => p.status === 'PENDING');
  const totalPendingVerification = pendingVerificationTxns.reduce((sum, p) => sum + p.amount, 0);

  // Determine current active bill (e.g. unpaid bill or the newest bill)
  const unpaidBills = unifiedBills.filter((b) => b.outstandingAmount > 0);
  const currentBill = unpaidBills.length > 0 ? unpaidBills[0] : (unifiedBills[0] || null);

  const primaryDueDate = currentBill ? currentBill.dueDate : new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 5).toISOString().split('T')[0];
  const primaryStatus = currentBill ? currentBill.status : (remainingOutstanding <= 0 ? 'PAID' : 'DUE');

  return {
    tenantId,
    tenantName,
    roomNumber,
    bedNumber,
    buildingName,
    monthlyRent,
    moveInDate,
    totalExpectedRent,
    totalApprovedPaid,
    totalPendingVerification,
    remainingOutstanding,
    totalDues: remainingOutstanding,
    dueDate: primaryDueDate,
    primaryStatus,
    isPayable: remainingOutstanding > 0 && primaryStatus !== 'VERIFICATION_PENDING' && primaryStatus !== 'PAID',
    isUnderVerification: primaryStatus === 'VERIFICATION_PENDING',
    isFullyPaid: primaryStatus === 'PAID',
    isPartiallyPaid: primaryStatus === 'PARTIAL',
    isOverdue: primaryStatus === 'OVERDUE',
    currentBill,
    invoices: unifiedBills,
    payments: tenantPayments
  };
}

/**
 * Calculates complete dashboard financial summary metrics across all tenants and bills.
 */
export function computeFinancialDashboardSummary(bills: UnifiedBill[]) {
  const totalExpected = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalCollected = bills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalOutstanding = bills.reduce((sum, b) => sum + b.outstandingAmount, 0);
  const totalOverdue = bills
    .filter((b) => b.status === 'OVERDUE')
    .reduce((sum, b) => sum + b.outstandingAmount, 0);

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;

  const countPaid = bills.filter((b) => b.status === 'PAID').length;
  const countPartial = bills.filter((b) => b.status === 'PARTIAL').length;
  const countDue = bills.filter((b) => b.status === 'DUE').length;
  const countOverdue = bills.filter((b) => b.status === 'OVERDUE').length;
  const countVerificationPending = bills.filter((b) => b.status === 'VERIFICATION_PENDING' || b.pendingVerificationCount > 0).length;

  return {
    totalExpected,
    totalCollected,
    totalOutstanding,
    totalOverdue,
    collectionRate,
    counts: {
      all: bills.length,
      paid: countPaid,
      partial: countPartial,
      due: countDue,
      overdue: countOverdue,
      verificationPending: countVerificationPending
    }
  };
}

