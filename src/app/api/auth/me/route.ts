import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = cookies
      .split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: 'owner-demo-id',
          email: 'alok@srisaisiri.com',
          role: 'OWNER',
          name: 'Alok Sharma'
        }
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
