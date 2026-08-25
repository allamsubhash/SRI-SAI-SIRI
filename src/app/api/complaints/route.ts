import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET() {
  try {
    const complaints = await dbService.getComplaints();
    return NextResponse.json(complaints);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId, title, description, category } = await request.json();
    if (!tenantId || !title || !description || !category) {
      return NextResponse.json({ error: 'Tenant ID, title, description, and category are required' }, { status: 400 });
    }
    const newComplaint = await dbService.createComplaint(tenantId, title, description, category);
    return NextResponse.json({ success: true, complaint: newComplaint });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { complaintId, status, employeeId } = await request.json();
    if (!complaintId || !status) {
      return NextResponse.json({ error: 'Complaint ID and target status are required' }, { status: 400 });
    }
    const updated = await dbService.updateComplaintStatus(complaintId, status, employeeId);
    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { complaintId, id } = await request.json();
    const targetId = complaintId || id;
    if (!targetId) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }
    await dbService.deleteComplaint(targetId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
