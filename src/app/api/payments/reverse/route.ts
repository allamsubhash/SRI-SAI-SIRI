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
      return NextResponse.json({ error: 'Access denied: Only owner can reverse or refund payments' }, { status: 403 });
    }

    const { paymentId, reason, reversalAmount } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reversal / refund reason is required for financial audit integrity' }, { status: 400 });
    }

    const result = await dbService.reverseTransaction({
      paymentId,
      reason: reason.trim(),
      reversedBy: payload.name || 'Owner',
      reversalAmount: reversalAmount ? Number(reversalAmount) : undefined
    });

    return NextResponse.json({
      message: 'Transaction reversed successfully. Audit trail preserved.',
      ...result
    });
  } catch (error: any) {
    console.error('API Payments Reverse error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reverse transaction' }, { status: 400 });
  }
}
