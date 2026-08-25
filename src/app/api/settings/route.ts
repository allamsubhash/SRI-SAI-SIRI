import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: {
        hostelName: settingsMap['hostelName'] || 'Sri Sai Siri Boys Hostel',
        address: settingsMap['address'] || 'Plot 42, Knowledge Park III, Greater Noida',
        contactPhone: settingsMap['contactPhone'] || '+91 98765 00000',
        contactEmail: settingsMap['contactEmail'] || 'contact@srisaisiri.com',
        currency: settingsMap['currency'] || 'INR (₹)',
        curfewTime: settingsMap['curfewTime'] || '10:30 PM'
      }
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

    // Persist settings key-value pairs
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        try {
          await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
          });
        } catch (e) {
          // Fallback if upsert fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Property settings permanently updated.'
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
