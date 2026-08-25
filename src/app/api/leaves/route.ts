import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET() {
  try {
    const leaves = await dbService.getLeaveRequests();
    return NextResponse.json(leaves);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId, startDate, endDate, reason } = await request.json();
    if (!tenantId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Tenant ID, start date, end date, and reason are required' }, { status: 400 });
    }
    const newLeave = await dbService.createLeaveRequest(tenantId, startDate, endDate, reason);
    return NextResponse.json({ success: true, leave: newLeave });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Leave ID and status are required' }, { status: 400 });
    }
    const updated = await dbService.approveLeaveRequest(id, status);
    return NextResponse.json({ success: true, leave: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
