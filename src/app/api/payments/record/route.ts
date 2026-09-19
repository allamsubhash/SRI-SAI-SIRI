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
      return NextResponse.json({ error: 'Unauthorized: Only Managers/Owners can record payments' }, { status: 403 });
    }

    const body = await request.json();
    const { tenantId, invoiceId, amount, paymentMethod, paymentType, referenceId, paymentDate, notes } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant selection is required' }, { status: 400 });
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    const payment = await dbService.recordPayment({
      tenantId,
      invoiceId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'UPI',
      paymentType: paymentType || 'Monthly Rent',
      referenceId: referenceId?.trim() || undefined,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      notes: notes?.trim() || undefined,
      recordedBy: payload.name || 'Owner'
    });

    // Refetch authoritative financial summary directly from database after recording
    const financialSummary = await dbService.getTenantFinancialSummary(tenantId);

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully and receipt generated',
      payment,
      financialSummary
    });
  } catch (error: any) {
    console.error('API Payments Record error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 400 });
  }
}
