import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Resolve tenant record
    let tenantObj: any = await dbService.getTenantByUserId(payload.userId);
    if (!tenantObj && (payload as any).tenantId) {
      const tenants = await dbService.getTenants();
      tenantObj = tenants.find((t: any) => t.id === (payload as any).tenantId) || null;
    }

    if (!tenantObj) {
      return NextResponse.json({ roommates: [], roomNumber: 'N/A' });
    }

    const roommates = await dbService.getTenantRoommates(tenantObj.id);

    return NextResponse.json({
      success: true,
      tenantId: tenantObj.id,
      roomNumber: tenantObj.roomNumber || 'N/A',
      roommates
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Error fetching roommates:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
