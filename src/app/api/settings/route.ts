import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await dbService.getSettings();
    return NextResponse.json({
      success: true,
      settings
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      settings: {
        hostelName: 'Sri Sai Siri Boys Hostel',
        address: 'Plot 42, Knowledge Park III, Greater Noida',
        contactPhone: '+91 98765 00000',
        contactEmail: 'contact@srisaisiri.com',
        currency: 'INR (₹)',
        curfewTime: '10:30 PM'
      }
    });
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
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 403 });
    }

    const data = await request.json();
    const updatedSettings = await dbService.saveSettings(data);

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Property settings permanently updated.'
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
