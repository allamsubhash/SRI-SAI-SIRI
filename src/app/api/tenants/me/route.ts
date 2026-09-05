import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = cookies
      .split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'No authentication token present' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    const tenant = await dbService.getTenantByUserId(payload.userId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found for logged in user' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tenant
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
