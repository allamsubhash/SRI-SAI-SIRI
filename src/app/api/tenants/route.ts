import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenants = await dbService.getTenants();
    return NextResponse.json(tenants);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const required = ['name', 'email', 'phone', 'gender', 'moveInDate', 'roomNumber', 'bedNumber', 'rentAmount', 'password'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 });
      }
    }

    const newTenant = await dbService.createTenant({
      name: data.name,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      address: data.address || '',
      aadhaar: data.aadhaar || '',
      emergencyName: data.emergencyName || '',
      emergencyPhone: data.emergencyPhone || '',
      guardianName: data.guardianName || '',
      guardianPhone: data.guardianPhone || '',
      occupation: data.occupation || 'Student',
      moveInDate: data.moveInDate,
      moveOutDate: null,
      status: 'ACTIVE',
      roomNumber: data.roomNumber,
      bedNumber: data.bedNumber,
      rentAmount: parseFloat(data.rentAmount),
      agreementUrl: data.agreementUrl || '/docs/default_agreement.pdf',
      medicalNotes: data.medicalNotes || '',
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop',
      password: data.password
    });

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, status, name, email, phone, gender, moveInDate } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    if (status) {
      await dbService.updateTenantStatus(id, status);
    } else {
      if (!name || !email || !phone || !gender || !moveInDate) {
        return NextResponse.json({ error: 'Name, email, phone, gender, and moveInDate are required for profile updates' }, { status: 400 });
      }
      await dbService.updateTenantProfile(id, { 
        name, 
        email, 
        phone, 
        gender, 
        moveInDate, 
        password: data.password,
        roomNumber: data.roomNumber,
        bedNumber: data.bedNumber,
        rentAmount: data.rentAmount ? parseFloat(data.rentAmount) : undefined
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }
    await dbService.deleteTenant(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
