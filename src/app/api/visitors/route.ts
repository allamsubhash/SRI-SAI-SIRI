import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const visitors = await dbService.getVisitors();
    return NextResponse.json(visitors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId, name, phone, personVisiting, checkIn } = await request.json();
    if (!tenantId || !name || !phone || !personVisiting || !checkIn) {
      return NextResponse.json({ error: 'Tenant ID, name, phone, person visiting, and check-in date/time are required' }, { status: 400 });
    }
    const newVisitor = await dbService.createVisitorRequest(tenantId, name, phone, personVisiting, checkIn);
    return NextResponse.json({ success: true, visitor: newVisitor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Visitor ID and status are required' }, { status: 400 });
    }
    const updated = await dbService.updateVisitorStatus(id, status);
    return NextResponse.json({ success: true, visitor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
