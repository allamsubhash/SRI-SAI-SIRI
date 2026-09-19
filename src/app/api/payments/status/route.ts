import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = cookies
      .split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized: Only Managers/Owners can update payment status' }, { status: 403 });
    }

    const body = await request.json();
    const { invoiceId, tenantId, status, notes } = body;

    if (!invoiceId && !tenantId) {
      return NextResponse.json({ error: 'Invoice or Tenant selection is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Target payment status is required' }, { status: 400 });
    }

    const result = await dbService.updateInvoiceStatus(
      invoiceId || '',
      status,
      payload.name || 'Owner',
      tenantId || undefined
    );

    let updatedSummary = null;
    if (tenantId) {
      updatedSummary = await dbService.getTenantFinancialSummary(tenantId);
    }

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${status} successfully`,
      result,
      financialSummary: updatedSummary
    });
  } catch (error: any) {
    console.error('API Payments Status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update payment status' }, { status: 400 });
  }
}
