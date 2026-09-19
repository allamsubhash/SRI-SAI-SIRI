import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'ALL', 'STAYING', 'CHECKOUT_TODAY', 'UPCOMING', 'PARTIAL', 'PENDING', 'CHECKED_OUT'
    const search = searchParams.get('search')?.toLowerCase();

    let guests = await dbService.getShortStayGuests();
    const stats = await dbService.getShortStayStats();
    const todayStr = new Date().toISOString().split('T')[0];

    // Filtering
    if (filter) {
      if (filter === 'STAYING') {
        guests = guests.filter((g: any) => g.status === 'ACTIVE');
      } else if (filter === 'CHECKOUT_TODAY') {
        guests = guests.filter((g: any) => {
          if (g.status !== 'ACTIVE') return false;
          const expDate = new Date(g.expectedCheckOutDate).toISOString().split('T')[0];
          return expDate === todayStr;
        });
      } else if (filter === 'UPCOMING') {
        guests = guests.filter((g: any) => {
          const checkInDate = new Date(g.checkInDate).toISOString().split('T')[0];
          return checkInDate > todayStr && g.status === 'ACTIVE';
        });
      } else if (filter === 'PARTIAL') {
        guests = guests.filter((g: any) => g.status === 'ACTIVE' && g.paymentStatus === 'PARTIALLY_PAID');
      } else if (filter === 'PENDING') {
        guests = guests.filter((g: any) => g.status === 'ACTIVE' && g.paymentStatus === 'PENDING');
      } else if (filter === 'CHECKED_OUT') {
        guests = guests.filter((g: any) => g.status === 'CHECKED_OUT');
      }
    }

    // Search by Name, Phone, Room, Bed
    if (search) {
      guests = guests.filter((g: any) => 
        g.name.toLowerCase().includes(search) ||
        g.phone.includes(search) ||
        (g.roomNumber && g.roomNumber.toLowerCase().includes(search)) ||
        (g.bedNumber && g.bedNumber.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      stats,
      guests
    });
  } catch (error: any) {
    console.error('Error fetching short-stay guests:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      phone, 
      buildingId, 
      buildingName, 
      roomId, 
      roomNumber, 
      bedId, 
      bedNumber, 
      checkInDate, 
      checkInTime, 
      expectedCheckOutDate, 
      expectedCheckOutTime, 
      numberOfDays, 
      dailyRent, 
      amountPaid, 
      paymentMethod, 
      receivedBy, 
      notes 
    } = body;

    if (!name || !phone || !checkInDate || !expectedCheckOutDate || !dailyRent) {
      return NextResponse.json(
        { success: false, error: 'Name, Phone, Check-in, Expected Check-out, and Daily Rent are required.' },
        { status: 400 }
      );
    }

    const newGuest = await dbService.createShortStayGuest({
      name,
      phone,
      buildingId,
      buildingName,
      roomId,
      roomNumber,
      bedId,
      bedNumber,
      checkInDate,
      checkInTime,
      expectedCheckOutDate,
      expectedCheckOutTime,
      numberOfDays: Number(numberOfDays) || 1,
      dailyRent: Number(dailyRent) || 0,
      amountPaid: Number(amountPaid) || 0,
      paymentMethod: paymentMethod || 'CASH',
      receivedBy: receivedBy || 'Hostel Manager',
      notes
    });

    return NextResponse.json({
      success: true,
      guest: newGuest
    });
  } catch (error: any) {
    console.error('Error creating short-stay guest:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
