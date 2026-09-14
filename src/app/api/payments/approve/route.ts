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
      return NextResponse.json({ error: 'Access denied: Only owner can approve payments' }, { status: 403 });
    }

    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const updated = await dbService.approvePayment(paymentId);

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      payment: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to approve payment' }, { status: 500 });
  }
}
