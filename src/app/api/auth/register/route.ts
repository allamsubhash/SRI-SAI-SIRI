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
        error: 'Invalid Owner Passkey! Owner registration requires a valid Security Passkey (e.g. SRISIRI-OWNER-2026).' 
      }, { status: 403 });
    }

    // Check existing user
    const existing = await dbService.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please log in.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Create user in Prisma DB
    let newUser: any;
    try {
      newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          role: 'OWNER',
          profile: {
            create: {
              firstName: name.split(' ')[0] || name,
              lastName: name.split(' ').slice(1).join(' ') || '',
              phone: '+91 98765 43210',
              status: 'ACTIVE'
            }
          }
        },
        include: { profile: true }
      });
    } catch (dbErr) {
      // Fallback
      newUser = {
        id: `u-owner-${Date.now()}`,
        email: cleanEmail,
        role: 'OWNER',
        name
      };
    }

    const userName = name || 'Owner Admin';
    const token = signToken({
      userId: newUser.id,
      email: cleanEmail,
      role: 'OWNER',
      name: userName
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: cleanEmail,
        role: 'OWNER',
        name: userName
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800,
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Owner Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
