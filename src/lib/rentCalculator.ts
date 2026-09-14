/**
 * SRI SAI SIRI BOYS HOSTEL - SINGLE AUTHORITATIVE RENT CALCULATOR
 * 
 * Enforces consistent rent calculations across all pages & portals:
 * - Dashboard metrics & revenue
 * - Resident profile
 * - Payments & Ledger
 * - Invoices & Bills
 * - Quick Invoice Generator
 * - Tenant Portal
 * - Reports & Analytics
 */

export interface RentBreakdown {
  baseRent: number;
  electricity: number;
  maintenance: number;
  extra: number;
  discount: number;
  totalPayable: number;
}

/**
 * Single source of truth for a tenant's current monthly rent rate.
 */
export function getTenantCurrentRent(tenant: any, room?: any): number {
  if (!tenant) return room?.rent || 8500;

  // 1. Tenant specific rent override
  if (tenant.rentAmount !== undefined && tenant.rentAmount !== null && Number(tenant.rentAmount) > 0) {
    return Number(tenant.rentAmount);
  }
  if (tenant.monthlyRent !== undefined && tenant.monthlyRent !== null && Number(tenant.monthlyRent) > 0) {
    return Number(tenant.monthlyRent);
  }
  if (tenant.rent !== undefined && tenant.rent !== null && Number(tenant.rent) > 0) {
    return Number(tenant.rent);
  }

  // 2. Room default rent
  if (room && room.rent !== undefined && room.rent !== null && Number(room.rent) > 0) {
    return Number(room.rent);
  }

  // 3. Fallback standard rate
  return 8500;
}

/**
 * Single authoritative function for calculating total invoice payable amount.
 */
export function calculateInvoiceTotal(
  baseRent: number,
  electricity: number = 0,
  maintenance: number = 0,
  extra: number = 0,
  discount: number = 0
): RentBreakdown {
  const cleanBase = Math.max(0, Number(baseRent) || 0);
  const cleanElec = Math.max(0, Number(electricity) || 0);
  const cleanMaint = Math.max(0, Number(maintenance) || 0);
  const cleanExtra = Math.max(0, Number(extra) || 0);
  const cleanDisc = Math.max(0, Number(discount) || 0);

  const totalPayable = Math.max(0, cleanBase + cleanElec + cleanMaint + cleanExtra - cleanDisc);

  return {
    baseRent: cleanBase,
    electricity: cleanElec,
    maintenance: cleanMaint,
    extra: cleanExtra,
    discount: cleanDisc,
    totalPayable
  };
}

export interface MonthlyDuesResult {
  monthlyRent: number;
  moveInDate: string;
  monthsElapsed: number;
  totalCharged: number;
  totalApprovedPaid: number;
  totalPendingApproval: number;
  totalDues: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING_APPROVAL' | 'OVERDUE' | 'UNPAID';
  nextDueDate: string;
}

/**
 * Calculates tenant dues strictly from moveInDate to current date.
 */
export function calculateMonthlyDues(
  tenant: any,
  payments: any[] = [],
  asOfDate: Date = new Date()
): MonthlyDuesResult {
  const monthlyRent = getTenantCurrentRent(tenant);
  
  // Resolve moveInDate
  const rawMoveIn = tenant?.moveInDate || tenant?.joiningDate || tenant?.profile?.moveInDate || '2026-01-15';
  const moveIn = new Date(rawMoveIn);
  const startDate = isNaN(moveIn.getTime()) ? new Date('2026-01-15') : moveIn;
  
  // Calculate months count from startDate to asOfDate
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const currentYear = asOfDate.getFullYear();
  const currentMonth = asOfDate.getMonth();
  
  let monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
  if (monthsElapsed < 1) monthsElapsed = 1;
  
  const totalCharged = monthsElapsed * monthlyRent;
  
  // Sum approved/paid payments
  const approvedPayments = (payments || []).filter(
    (p: any) => p.status === 'PAID' || p.status === 'APPROVED'
  );
  const totalApprovedPaid = approvedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  
  // Sum pending payments
  const pendingPayments = (payments || []).filter(
    (p: any) => p.status === 'PENDING'
  );
  const totalPendingApproval = pendingPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  
  const totalDues = Math.max(0, totalCharged - totalApprovedPaid);
  
  let status: 'PAID' | 'PARTIAL' | 'PENDING_APPROVAL' | 'OVERDUE' | 'UNPAID' = 'UNPAID';
  
  if (totalDues === 0) {
    status = 'PAID';
  } else if (totalPendingApproval >= totalDues) {
    status = 'PENDING_APPROVAL';
  } else if (totalApprovedPaid > 0) {
    status = 'PARTIAL';
  } else {
    // Check if current day of month > 5th
    const currentDay = asOfDate.getDate();
    if (currentDay > 5) {
      status = 'OVERDUE';
    } else {
      status = 'UNPAID';
    }
  }

  // Next due date: 5th of current/next month
  const nextDueDateObj = new Date(asOfDate.getFullYear(), asOfDate.getMonth() + (totalDues === 0 ? 1 : 0), 5);
  const nextDueDate = nextDueDateObj.toISOString().split('T')[0];

  return {
    monthlyRent,
    moveInDate: startDate.toISOString().split('T')[0],
    monthsElapsed,
    totalCharged,
    totalApprovedPaid,
    totalPendingApproval,
    totalDues,
    status,
    nextDueDate
  };
}

