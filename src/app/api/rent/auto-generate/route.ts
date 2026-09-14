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
      return NextResponse.json({ error: 'Access denied: Only owner can auto-generate rent invoices' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const billingMonth = body.billingMonth || 'September 2026';

    const result = await dbService.autoGenerateMonthlyInvoices(billingMonth);

    return NextResponse.json({
      success: true,
      message: `Auto-generated ${result.count} rent invoice(s) for ${billingMonth} and sent notifications to residents.`,
      result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to auto-generate invoices' }, { status: 500 });
  }
}
