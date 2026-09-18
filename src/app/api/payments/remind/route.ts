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
      return NextResponse.json({ error: 'Access denied: Only owner/manager can send payment reminders' }, { status: 403 });
    }

    const { invoiceId, reminderType, channel } = await request.json();
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const result = await dbService.sendPaymentReminder({
      invoiceId,
      reminderType: reminderType || 'Upcoming Due',
      channel: channel || 'WhatsApp',
      sentBy: payload.name || 'Manager'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Payments Remind error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reminder' }, { status: 400 });
  }
}
