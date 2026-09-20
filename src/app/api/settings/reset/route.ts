import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    if (action === 'PURGE_ALL_DATA' || action === 'RESET_ALL' || action === 'DELETE_EVERYTHING') {
      const success = await dbService.purgeAllData();
      return NextResponse.json({ success, message: 'All buildings, tenants, rooms, payments, and data purged clean.' });
    }
    if (action === 'RESET_ANALYTICS') {
      const success = await dbService.resetAnalytics();
      return NextResponse.json({ success });
    }
    if (action === 'RESET_TENANTS') {
      const success = await dbService.resetTenants();
      return NextResponse.json({ success });
    }
    return NextResponse.json({ error: 'Invalid reset action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
