/**
 * Indian Date & Currency Formatting Utilities for Sri Sai Siri Boys Hostel
 */

export function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN');
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | Date | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(dateString);
  }
}
