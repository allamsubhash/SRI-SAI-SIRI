import { getTenantCurrentRent } from './rentCalculator';

export interface UnifiedTenantBillingState {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  bedNumber: string;
  monthlyRent: number;
  moveInDate: string;
  
  totalExpectedRent: number;
  totalApprovedPaid: number;
  totalPendingVerification: number;
  remainingOutstanding: number;
  totalDues: number;
  
  dueDate: string;
  primaryStatus: 'PAID' | 'UNDER_VERIFICATION' | 'OVERDUE' | 'DUE' | 'PARTIAL' | 'NO_DUE';
  
  isPayable: boolean;
  isUnderVerification: boolean;
  isFullyPaid: boolean;
  
  invoices: any[];
  payments: any[];
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
  asOfDate: Date = new Date()
): UnifiedTenantBillingState {
  const monthlyRent = getTenantCurrentRent(tenant);
  const tenantId = tenant?.id || tenant?.userId || 'unknown';
  const tenantName = tenant?.name || tenant?.profile?.name || 'Resident Tenant';
  const roomNumber = tenant?.roomNumber || 'A-101';
  const bedNumber = tenant?.bedNumber || 'Bed A';
  const moveInDate = tenant?.moveInDate || tenant?.joiningDate || '2026-01-15';

  // 1. Filter payments belonging to this tenant
  const tenantPayments = (rawPayments || []).filter((p: any) => 
    p.tenantId === tenantId || 
    (tenant.userId && (p.tenantId === tenant.userId || p.userId === tenant.userId)) ||
    (p.tenantName && tenantName && p.tenantName.toLowerCase().trim().includes(tenantName.toLowerCase().trim()))
  );

  // 2. Filter invoices belonging to this tenant
  let tenantInvoices = (rawInvoices || []).filter((inv: any) => 
    inv.tenantId === tenantId || 
    (tenant.userId && (inv.tenantId === tenant.userId || inv.userId === tenant.userId)) ||
    (inv.tenantName && tenantName && inv.tenantName.toLowerCase().trim().includes(tenantName.toLowerCase().trim()))
  );

  // If no invoice exists, generate a virtual invoice for current month
  if (tenantInvoices.length === 0) {
    const currentDay = asOfDate.getDate();
    const dueDateStr = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 5).toISOString().split('T')[0];
    tenantInvoices = [{
      id: `inv-${tenantId}`,
      tenantId: tenantId,
      tenantName: tenantName,
      amount: monthlyRent,
      paidAmount: 0,
      dueDate: dueDateStr,
      status: currentDay > 5 ? 'OVERDUE' : 'PENDING',
      billingMonth: asOfDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString()
    }];
  }

  // 3. Sum approved payments
  const approvedPayments = tenantPayments.filter((p: any) => p.status === 'APPROVED' || p.status === 'PAID');
  const totalApprovedPaid = approvedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  // 4. Sum pending verification payments
  const pendingPayments = tenantPayments.filter((p: any) => p.status === 'PENDING' || p.status === 'PENDING_VERIFICATION' || p.status === 'VERIFICATION');
  const totalPendingVerification = pendingPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  // 5. Calculate total expected rent from invoices
  const totalExpectedRent = tenantInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

  // 6. Remaining outstanding strictly: max(0, totalExpectedRent - totalApprovedPaid)
  const remainingOutstanding = Math.max(0, totalExpectedRent - totalApprovedPaid);

  // 7. Resolve due date
  const unpaidInvoices = tenantInvoices.filter((inv: any) => (Number(inv.amount) || 0) > (Number(inv.paidAmount) || 0));
  const latestDueDate = unpaidInvoices.length > 0 && unpaidInvoices[0].dueDate
    ? unpaidInvoices[0].dueDate
    : new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 5).toISOString().split('T')[0];

  // 8. Determine Primary Status (HARD RULES)
  let primaryStatus: 'PAID' | 'UNDER_VERIFICATION' | 'OVERDUE' | 'DUE' | 'PARTIAL' | 'NO_DUE' = 'NO_DUE';

  if (remainingOutstanding <= 0) {
    // HARD RULE: IF OUTSTANDING IS 0, STATUS MUST BE PAID! NEVER OVERDUE OR DUE!
    primaryStatus = 'PAID';
  } else if (totalPendingVerification >= remainingOutstanding && totalPendingVerification > 0) {
    primaryStatus = 'UNDER_VERIFICATION';
  } else if (totalApprovedPaid > 0 && totalApprovedPaid < totalExpectedRent) {
    primaryStatus = 'PARTIAL';
  } else {
    const dueDateObj = new Date(latestDueDate);
    const isPastDue = !isNaN(dueDateObj.getTime()) && dueDateObj < asOfDate;
    primaryStatus = isPastDue ? 'OVERDUE' : 'DUE';
  }

  // 9. Synchronize returned invoices with primary status
  const syncedInvoices = tenantInvoices.map((inv: any) => {
    let invStatus = inv.status;
    if (primaryStatus === 'PAID') {
      invStatus = 'PAID';
    } else if (primaryStatus === 'UNDER_VERIFICATION') {
      invStatus = 'VERIFICATION';
    } else if (primaryStatus === 'OVERDUE') {
      invStatus = 'OVERDUE';
    } else if (primaryStatus === 'PARTIAL') {
      invStatus = 'PARTIAL';
    } else {
      invStatus = 'PENDING';
    }
    return {
      ...inv,
      status: invStatus,
      paidAmount: primaryStatus === 'PAID' ? inv.amount : Math.min(inv.amount, totalApprovedPaid),
      remainingDue: primaryStatus === 'PAID' ? 0 : Math.max(0, inv.amount - totalApprovedPaid)
    };
  });

  return {
    tenantId,
    tenantName,
    roomNumber,
    bedNumber,
    monthlyRent,
    moveInDate,
    totalExpectedRent,
    totalApprovedPaid,
    totalPendingVerification,
    remainingOutstanding,
    totalDues: remainingOutstanding,
    dueDate: latestDueDate,
    primaryStatus,
    isPayable: remainingOutstanding > 0 && primaryStatus !== 'UNDER_VERIFICATION' && primaryStatus !== 'PAID',
    isUnderVerification: primaryStatus === 'UNDER_VERIFICATION',
    isFullyPaid: primaryStatus === 'PAID',
    invoices: syncedInvoices,
    payments: tenantPayments
  };
}
