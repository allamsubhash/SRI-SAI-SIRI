import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 'ALL';
    const buildingId = searchParams.get('buildingId') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';

    const workspaceData = await dbService.getPaymentsWorkspace({
      month,
      buildingId,
      status,
      search
    });

    return NextResponse.json({
      success: true,
      ...workspaceData
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('API Payments Workspace GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payments workspace' }, { status: 500 });
  }
}
