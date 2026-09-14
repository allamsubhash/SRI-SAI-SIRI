import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await dbService.getQRPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch QR settings' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'Access denied: Only owner can modify settings' }, { status: 403 });
    }

    const body = await request.json();
    const { qrCodeUrl, upiId, instructions } = body;

    const updated = await dbService.saveQRPaymentSettings({ qrCodeUrl, upiId, instructions });

    return NextResponse.json({
      success: true,
      message: 'QR Payment settings updated successfully',
      settings: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save QR settings' }, { status: 500 });
  }
}
