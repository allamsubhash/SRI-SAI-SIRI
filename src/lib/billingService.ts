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

export interface TenantNextDueInfo {
  nextDueDate: string; // YYYY-MM-DD
  formattedNextDueDate: string; // e.g. "November 15, 2026"
  billingMonth: string; // e.g. "November 2026"
  rentAmount: number; // e.g. 5000
  outstandingBalance: number; // e.g. 0
  status: 'Upcoming' | 'Due Today' | 'Overdue' | 'Paid';
  daysDifference: number; // positive = days remaining, negative = days overdue, 0 = today
  statusLabel: string; // e.g. "12 days remaining", "Due today", "3 days overdue", "Paid"
  previousUnpaidRent: number; // Sum of unpaid amounts from previous cycles
  previousUnpaidPeriods: { period: string; amount: number; dueDate: string }[];
  cycleDay: number;
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
  nextDueInfo: TenantNextDueInfo;
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
  // Floating Point Currency Normalization (2 decimal places)
  const cleanAmount = Number((Number(amount) || 0).toFixed(2));
  const cleanPaid = Number((Number(paidAmount) || 0).toFixed(2));
  const rawOutstanding = cleanAmount - cleanPaid;
  const outstanding = Math.max(0, Number(rawOutstanding.toFixed(2)));

  // RULE 1 (HIGHEST PRIORITY): If Outstanding <= 0.01 -> ALWAYS PAID
  if (outstanding <= 0.01) {
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

  // RULE 3: If Outstanding > 0 and Due Date passed -> OVERDUE
  if (isPastDueDate) {
    return 'OVERDUE';
  }

  // RULE 4: If Outstanding > 0, Due Date NOT passed, and Paid > 0 -> PARTIAL
  if (cleanPaid > 0) {
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

  // Derive tenant's billing cycle day from moveInDate / joiningDate
  let cycleDay = 15;
  let moveInObj: Date | null = null;
  if (moveInDate) {
    const parsedMoveIn = new Date(moveInDate);
    if (!isNaN(parsedMoveIn.getTime())) {
      cycleDay = parsedMoveIn.getDate();
      moveInObj = parsedMoveIn;
    }
  }

  // Pre-move-in safeguard: A resident must NEVER be charged or show unpaid dues for periods prior to moveInDate
  if (moveInObj) {
    const moveInYear = moveInObj.getFullYear();
    const moveInMonth = moveInObj.getMonth();
    tenantInvoicesRaw = tenantInvoicesRaw.filter((inv: any) => {
      if (inv.dueDate) {
        const d = new Date(inv.dueDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = d.getMonth();
          if (y < moveInYear || (y === moveInYear && m < moveInMonth)) {
            return false;
          }
        }
      }
      return true;
    });
  }

  // Helper to normalize period name
  const cleanPeriod = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // Current month string representation (e.g. "October 2026")
  const currentMonthStr = asOfDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Generate missing billing cycles from move-in date up to asOfDate
  const startDate = new Date(moveInDate);
  let startYear = !isNaN(startDate.getTime()) ? startDate.getFullYear() : asOfDate.getFullYear();
  let startMonth = !isNaN(startDate.getTime()) ? startDate.getMonth() : asOfDate.getMonth();

  // Clamp historical generation to at most 12 months back to preserve performance
  const monthsDiff = (asOfDate.getFullYear() - startYear) * 12 + (asOfDate.getMonth() - startMonth);
  if (monthsDiff > 12) {
    const clamped = new Date(asOfDate.getFullYear(), asOfDate.getMonth() - 12, cycleDay);
    startYear = clamped.getFullYear();
    startMonth = clamped.getMonth();
  }

  let iterY = startYear;
  let iterM = startMonth;
  while (iterY < asOfDate.getFullYear() || (iterY === asOfDate.getFullYear() && iterM <= asOfDate.getMonth())) {
    const cycleMonthStr = new Date(iterY, iterM, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const cyclePrefix = `${iterY}-${String(iterM + 1).padStart(2, '0')}`;

    const hasInvoiceForCycle = tenantInvoicesRaw.some((inv: any) => {
      if (inv.billingMonth && cleanPeriod(inv.billingMonth) === cleanPeriod(cycleMonthStr)) return true;
      if (inv.billingPeriod && cleanPeriod(inv.billingPeriod) === cleanPeriod(cycleMonthStr)) return true;
      if (inv.dueDate && typeof inv.dueDate === 'string' && inv.dueDate.startsWith(cyclePrefix)) return true;
      if (inv.itemsJson && typeof inv.itemsJson === 'string' && inv.itemsJson.toLowerCase().includes(cycleMonthStr.toLowerCase())) return true;
      return false;
    });

    if (!hasInvoiceForCycle) {
      const maxDaysInMonth = new Date(iterY, iterM + 1, 0).getDate();
      const targetDay = Math.min(cycleDay, maxDaysInMonth);
      const dueDateStr = `${iterY}-${String(iterM + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

      const autoCycleInvoice = {
        id: `inv-${iterY}-${String(iterM + 1).padStart(2, '0')}-${tenantId}`,
        number: `INV-${iterY}-${String(iterM + 1).padStart(2, '0')}-${String(tenantId).replace(/[^0-9]/g, '').slice(-3) || '001'}`,
        tenantId: tenantId,
        tenantName: tenantName,
        roomNumber: roomNumber,
        amount: monthlyRent,
        paidAmount: 0,
        dueDate: dueDateStr,
        billingMonth: cycleMonthStr,
        billingPeriod: cycleMonthStr,
        itemsJson: JSON.stringify([{ description: `Monthly Hostel Rent - ${cycleMonthStr}`, amount: monthlyRent }]),
        createdAt: new Date(iterY, iterM, targetDay).toISOString()
      };
      tenantInvoicesRaw.push(autoCycleInvoice);
    }

    iterM++;
    if (iterM > 11) {
      iterM = 0;
      iterY++;
    }
  }

  // 3. STRICT PAYMENT ALLOCATION TO BILLING PERIODS
  // Group payments strictly by invoiceId or billingPeriod to avoid cross-contamination
  const invoicePaymentsMap = new Map<string, PaymentTransaction[]>();
  const unallocatedPayments: { p: PaymentTransaction; remainingAmount: number }[] = [];

  for (const p of tenantPayments) {
    let matchedInvoiceId: string | null = null;

    if (p.invoiceId) {
      const matched = tenantInvoicesRaw.find((inv: any) => inv.id === p.invoiceId);
      if (matched) matchedInvoiceId = matched.id;
    }

    if (!matchedInvoiceId) {
      // Check notes or reference for explicit billing period (e.g. "September 2026")
      const candidatePeriod = tenantInvoicesRaw.find((inv: any) => {
        const pStr = cleanPeriod(inv.billingMonth || inv.billingPeriod);
        if (!pStr) return false;
        if (p.notes && cleanPeriod(p.notes).includes(pStr)) return true;
        if ((p as any).billingPeriod && cleanPeriod((p as any).billingPeriod) === pStr) return true;
        if ((p as any).billingMonth && cleanPeriod((p as any).billingMonth) === pStr) return true;
        return false;
      });
      if (candidatePeriod) {
        matchedInvoiceId = candidatePeriod.id;
      }
    }

    if (matchedInvoiceId) {
      const existing = invoicePaymentsMap.get(matchedInvoiceId) || [];
      existing.push(p);
      invoicePaymentsMap.set(matchedInvoiceId, existing);
    } else {
      unallocatedPayments.push({ p, remainingAmount: p.amount });
    }
  }

  // Allocate remaining unallocated payments in FIFO order across invoices sorted by dueDate asc
  const sortedRawInvoicesForAllocation = [...tenantInvoicesRaw].sort((a: any, b: any) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return da - db;
  });

  for (const inv of sortedRawInvoicesForAllocation) {
    const invTotal = Number(inv.amount) || monthlyRent;
    const alreadyAllocated = (invoicePaymentsMap.get(inv.id) || [])
      .filter(p => p.status === 'APPROVED' || p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    let needed = Math.max(0, invTotal - alreadyAllocated);

    if (needed > 0 && unallocatedPayments.length > 0) {
      for (const unalloc of unallocatedPayments) {
        if (unalloc.remainingAmount <= 0) continue;
        const take = Math.min(needed, unalloc.remainingAmount);
        unalloc.remainingAmount -= take;
        needed -= take;

        const allocatedTxn: PaymentTransaction = {
          ...unalloc.p,
          amount: take,
          invoiceId: inv.id
        };

        const existing = invoicePaymentsMap.get(inv.id) || [];
        existing.push(allocatedTxn);
        invoicePaymentsMap.set(inv.id, existing);

        if (needed <= 0) break;
      }
    }
  }

  // 4. Associate transactions and reminders with each bill
  const unifiedBills: UnifiedBill[] = tenantInvoicesRaw.map((inv: any) => {
    let itemsList: any[] = [];
    try {
      if (Array.isArray(inv.items)) itemsList = inv.items;
      else if (typeof inv.itemsJson === 'string') itemsList = JSON.parse(inv.itemsJson);
      if (!Array.isArray(itemsList)) itemsList = (itemsList as any)?.items || [];
    } catch {
      itemsList = [];
    }

    let derivedBillingPeriod = '';
    if (inv.dueDate) {
      const dueD = new Date(inv.dueDate);
      if (!isNaN(dueD.getTime())) {
        derivedBillingPeriod = dueD.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      }
    }
    const billingPeriod = inv.billingMonth || inv.billingPeriod || derivedBillingPeriod || currentMonthStr;

    if (itemsList.length === 0) {
      itemsList = [{ description: `Monthly Hostel Rent (${billingPeriod})`, amount: Number(inv.amount) || monthlyRent }];
    }

    // Transactions strictly allocated to THIS invoice
    const billTransactions = invoicePaymentsMap.get(inv.id) || [];

    // Valid payments are APPROVED or PAID
    const approvedTxns = billTransactions.filter((p) => p.status === 'APPROVED' || p.status === 'PAID');
    const validPaidSum = approvedTxns.reduce((sum, p) => sum + p.amount, 0);

    const pendingTxns = billTransactions.filter((p) => p.status === 'PENDING' || (p.status as string) === 'PENDING_VERIFICATION');
    const hasPendingVerification = pendingTxns.length > 0;

    const totalBillAmount = Number((Number(inv.amount) || monthlyRent).toFixed(2));
    
    // Effective paid amount: use sum of allocated approved payments, or fallback to inv.paidAmount if no transactions recorded
    let effectivePaidAmount = 0;
    if (approvedTxns.length > 0) {
      effectivePaidAmount = Math.min(totalBillAmount, Number(validPaidSum.toFixed(2)));
    } else if (Number(inv.paidAmount) > 0) {
      effectivePaidAmount = Math.min(totalBillAmount, Number(Number(inv.paidAmount).toFixed(2)));
    }

    const outstanding = Math.max(0, Number((totalBillAmount - effectivePaidAmount).toFixed(2)));

    const maxDays = new Date(asOfDate.getFullYear(), asOfDate.getMonth() + 1, 0).getDate();
    const fallbackDay = Math.min(cycleDay, maxDays);
    const dueDateStr = inv.dueDate 
      ? (typeof inv.dueDate === 'string' ? inv.dueDate.split('T')[0] : new Date(inv.dueDate).toISOString().split('T')[0])
      : `${asOfDate.getFullYear()}-${String(asOfDate.getMonth() + 1).padStart(2, '0')}-${String(fallbackDay).padStart(2, '0')}`;

    const computedStatus = calculateBillStatus(totalBillAmount, effectivePaidAmount, dueDateStr, hasPendingVerification, asOfDate);

    // Bill reminders
    const billReminders = (rawReminders || []).filter((r: any) => r.invoiceId === inv.id || r.tenantId === tenantId);

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

  // Sort bills by due date descending (newest first for UI presentation)
  unifiedBills.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Aggregate Tenant-Level Metrics
  const totalExpectedRent = unifiedBills.reduce((sum, b) => sum + b.amount, 0);
  const totalApprovedPaid = unifiedBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const remainingOutstanding = Math.max(0, totalExpectedRent - totalApprovedPaid);

  const pendingVerificationTxns = tenantPayments.filter((p) => p.status === 'PENDING' || (p.status as string) === 'PENDING_VERIFICATION');
  const totalPendingVerification = pendingVerificationTxns.reduce((sum, p) => sum + p.amount, 0);

  // 5. COMPUTE EXACT AUTHORITATIVE NEXT DUE DATE & SCHEDULE BREAKDOWN
  // Sort ascending by dueDate to identify earliest unpaid / upcoming bills
  const billsAscending = [...unifiedBills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const unpaidBillsAsc = billsAscending.filter(b => b.outstandingAmount > 0);

  let nextDueInfo: TenantNextDueInfo;

  if (unpaidBillsAsc.length > 0) {
    const targetBill = unpaidBillsAsc[0];
    const targetDueDateObj = new Date(targetBill.dueDate);
    const targetDueTime = new Date(targetDueDateObj.getFullYear(), targetDueDateObj.getMonth(), targetDueDateObj.getDate()).getTime();
    const asOfTime = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate()).getTime();
    const diffDays = Math.round((targetDueTime - asOfTime) / (1000 * 60 * 60 * 24));

    let status: 'Upcoming' | 'Due Today' | 'Overdue' | 'Paid';
    let statusLabel: string;

    if (diffDays < 0) {
      status = 'Overdue';
      statusLabel = `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} overdue`;
    } else if (diffDays === 0) {
      status = 'Due Today';
      statusLabel = 'Due today';
    } else {
      status = 'Upcoming';
      statusLabel = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`;
    }

    // Previous unpaid rent (unpaid bills older than the target bill)
    const previousUnpaidPeriods = unpaidBillsAsc
      .filter(b => b.id !== targetBill.id && new Date(b.dueDate).getTime() < targetDueTime)
      .map(b => ({ period: b.billingPeriod, amount: b.outstandingAmount, dueDate: b.dueDate }));

    const previousUnpaidRent = previousUnpaidPeriods.reduce((sum, p) => sum + p.amount, 0);

    const formattedNextDueDate = targetDueDateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    nextDueInfo = {
      nextDueDate: targetBill.dueDate,
      formattedNextDueDate,
      billingMonth: targetBill.billingMonth,
      rentAmount: targetBill.amount,
      outstandingBalance: targetBill.outstandingAmount,
      status,
      daysDifference: diffDays,
      statusLabel,
      previousUnpaidRent,
      previousUnpaidPeriods,
      cycleDay
    };
  } else {
    // All generated bills are PAID! Calculate next upcoming cycle
    const latestBill = billsAscending[billsAscending.length - 1];
    let nextMonth = asOfDate.getMonth() + 1;
    let nextYear = asOfDate.getFullYear();
    if (latestBill && latestBill.dueDate) {
      const latestDue = new Date(latestBill.dueDate);
      nextMonth = latestDue.getMonth() + 1;
      nextYear = latestDue.getFullYear();
    }
    if (nextMonth > 11) {
      nextMonth = nextMonth % 12;
      nextYear += 1;
    }

    const maxDaysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const targetDay = Math.min(cycleDay, maxDaysInNextMonth);
    const nextDueDateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    const nextDueDateObj = new Date(nextYear, nextMonth, targetDay);

    const asOfTime = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate()).getTime();
    const targetDueTime = nextDueDateObj.getTime();
    const diffDays = Math.max(0, Math.round((targetDueTime - asOfTime) / (1000 * 60 * 60 * 24)));

    const formattedNextDueDate = nextDueDateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const nextBillingMonth = nextDueDateObj.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });

    nextDueInfo = {
      nextDueDate: nextDueDateStr,
      formattedNextDueDate,
      billingMonth: nextBillingMonth,
      rentAmount: monthlyRent,
      outstandingBalance: 0,
      status: 'Upcoming',
      daysDifference: diffDays,
      statusLabel: diffDays === 0 ? 'Due today' : `${diffDays} days remaining`,
      previousUnpaidRent: 0,
      previousUnpaidPeriods: [],
      cycleDay
    };
  }

  // Determine primary bill to show on cards
  const unpaidBills = unifiedBills.filter((b) => b.outstandingAmount > 0);
  const currentBill = unpaidBills.length > 0 ? unpaidBills[unpaidBills.length - 1] : (unifiedBills[0] || null);

  const primaryDueDate = nextDueInfo.nextDueDate;
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
    isFullyPaid: remainingOutstanding <= 0,
    isPartiallyPaid: remainingOutstanding > 0 && totalApprovedPaid > 0,
    isOverdue: primaryStatus === 'OVERDUE' || nextDueInfo.status === 'Overdue',
    currentBill,
    invoices: unifiedBills,
    payments: tenantPayments,
    nextDueInfo
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

