import { NextResponse } from 'next/server';
import { verifyToken, extractAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = extractAuthToken(request);

    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'No authentication token present' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    const { dbService } = await import('@/lib/db');
    const liveUser = await dbService.getUserByEmail(payload.email);
    const resolvedName = liveUser?.name || payload.name;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: resolvedName
      }
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
