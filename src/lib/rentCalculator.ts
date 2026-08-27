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
