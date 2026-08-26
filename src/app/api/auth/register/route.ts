import { NextResponse } from 'next/server';
import { dbService, prisma } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_OWNER_PASSKEYS = [
  'SRISIRI-OWNER-2026',
  'OWNER2026',
  'SRISIRI2026',
  'PASSKEY123',
  (process.env.OWNER_PASSKEY || '').toUpperCase()
].filter(Boolean);

export async function POST(request: Request) {
  try {
    const { name, email, password, ownerKey, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Owner Registration Passkey Verification
    const providedPasskey = (ownerKey || '').trim().toUpperCase();
    if (!providedPasskey || !VALID_OWNER_PASSKEYS.includes(providedPasskey)) {
      return NextResponse.json({ 
        error: 'Invalid Owner Passkey! Administrative authorization failed.' 
      }, { status: 403 });
    }

    // Check existing user
    const existing = await dbService.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please log in.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userName = name || 'Owner Admin';

    // Register user in dbService runtime state + Prisma DB
    const newUser = await dbService.registerUser({
      id: `u-owner-${Date.now()}`,
      email: cleanEmail,
      password: hashedPassword,
      role: 'OWNER',
      name: userName
    });

    const token = signToken({
      userId: newUser?.id || `u-owner-${Date.now()}`,
      email: cleanEmail,
      role: 'OWNER',
      name: userName
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser?.id || `u-owner-${Date.now()}`,
        email: cleanEmail,
        role: 'OWNER',
        name: userName
      }
    });

    // 1. Set active session cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800,
      path: '/'
    });

    // 2. Set persistent user account & password cookies for serverless compatibility across Vercel builds
    const accCookieName = `user_acc_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    const pwdCookieName = `pwd_hash_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    const accData = JSON.stringify({
      id: newUser?.id || `u-owner-${Date.now()}`,
      email: cleanEmail,
      password: hashedPassword,
      role: 'OWNER',
      name: userName
    });

    response.cookies.set(accCookieName, encodeURIComponent(accData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 315360000,
      path: '/'
    });

    response.cookies.set(pwdCookieName, encodeURIComponent(hashedPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 315360000,
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Owner Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
