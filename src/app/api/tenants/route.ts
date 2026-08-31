import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenants = await dbService.getTenants();
    return NextResponse.json(tenants, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields (only name and email are strictly mandatory)
    if (!data.name || !data.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = data.email.trim().toLowerCase();

    // Check server-side bed availability (Phase 10: Prevent race conditions & duplicate bed assignment)
    const targetBedSpot = data.bedNumber;
    if (targetBedSpot) {
      const buildings = await dbService.getBuildings();
      let isOccupied = false;
      buildings.forEach((b: any) => {
        b.floors?.forEach((f: any) => {
          f.rooms?.forEach((r: any) => {
            r.beds?.forEach((bed: any) => {
              if (bed.number === targetBedSpot && !bed.isAvailable) {
                isOccupied = true;
              }
            });
          });
        });
      });
      if (isOccupied) {
        return NextResponse.json({ error: `Bed spot '${targetBedSpot}' is already occupied. Please select an available bed.` }, { status: 400 });
      }
    }

    const rawPassword = data.password || 'password123';
    const hashedPassword = await hashPassword(rawPassword);

    const newTenant = await dbService.createTenant({
      name: data.name,
      email: cleanEmail,
      phone: data.phone || '+91 98765 43210',
      gender: data.gender || 'Male',
      address: data.address || '',
      aadhaar: data.aadhaar || '',
      emergencyName: data.emergencyName || '',
      emergencyPhone: data.emergencyPhone || '',
      guardianName: data.guardianName || '',
      guardianPhone: data.guardianPhone || '',
      occupation: data.occupation || 'Student',
      moveInDate: data.moveInDate || new Date().toISOString().split('T')[0],
      roomNumber: data.roomNumber || 'A-101',
      bedNumber: data.bedNumber || 'Bed A',
      rentAmount: parseFloat(data.rentAmount || 8500),
      agreementUrl: data.agreementUrl || '/docs/default_agreement.pdf',
      medicalNotes: data.medicalNotes || '',
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop',
      password: hashedPassword
    });

    // Register User account for resident login
    await dbService.registerUser({
      id: newTenant.userId || `u-tenant-${Date.now()}`,
      email: cleanEmail,
      password: hashedPassword,
      role: 'TENANT',
      name: data.name
    });

    const response = NextResponse.json({ success: true, tenant: newTenant });

    // Set 10-year persistent account & password cookies for resident login
    const accCookieName = `user_acc_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    const pwdCookieName = `pwd_hash_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    const accData = JSON.stringify({
      id: newTenant.userId || `u-tenant-${Date.now()}`,
      email: cleanEmail,
      password: hashedPassword,
      role: 'TENANT',
      name: data.name
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
