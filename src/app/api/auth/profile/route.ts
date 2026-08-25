import { NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
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
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (payload.role === 'TENANT') {
      return NextResponse.json({ error: 'Access Denied: Only the hostel owner can update a tenant\'s registered profile name.' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    // Update Profile and User records in the Database
    try {
      // Find profile by userId
      const userProfile = await prisma.profile.findFirst({
        where: { userId: payload.userId }
      });
      if (userProfile) {
        await prisma.profile.update({
          where: { id: userProfile.id },
          data: { firstName, lastName }
        });
      }
    } catch (e) {
      console.warn("DB profile update bypassed or failed", e);
    }

    // Sign new token with updated name
    const newToken = signToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: name
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: name
      }
    });

    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
