import { NextResponse } from 'next/server';
import { verifyToken, comparePassword, hashPassword } from '@/lib/auth';
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
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current password and new password are required' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password cannot be the same as your current password.' }, { status: 400 });
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const pwdCookieName = `pwd_hash_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    const overriddenHash = cookies
      .split(';')
      .find(c => c.trim().startsWith(`${pwdCookieName}=`))
      ?.split('=')[1];

    // Retrieve user record
    const user = await dbService.getUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    let isValid = await comparePassword(currentPassword, user.password);
    if (!isValid && overriddenHash) {
      isValid = await comparePassword(currentPassword, decodeURIComponent(overriddenHash));
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const newHashedPassword = await hashPassword(newPassword);
    await dbService.updateUserPassword(cleanEmail, newHashedPassword);

    const response = NextResponse.json({
      success: true,
      hash: newHashedPassword,
      message: 'Password permanently updated! Old password invalidated. Please use your new password for all future logins.'
    });

    // Set persistent HTTP-Only cookie with new password hash for serverless environment compatibility
    response.cookies.set(pwdCookieName, encodeURIComponent(newHashedPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 31536000,
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
