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
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, amount, paymentMethod, referenceId, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Resolve tenant ID if not passed directly or if user is tenant
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId && payload.role === 'TENANT') {
      const tenantObj = await dbService.getTenantByUserId(payload.userId);
      resolvedTenantId = tenantObj?.id;
    }

    if (!resolvedTenantId) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    const payment = await dbService.submitTenantPayment({
      tenantId: resolvedTenantId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'ONLINE',
      referenceId: referenceId || '',
      notes: notes || ''
    });

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully and pending owner approval',
      payment
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit payment' }, { status: 500 });
  }
}
