import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { floorId, number, type, rent, capacity, amenities } = await request.json();
    if (!floorId || !number || rent === undefined || capacity === undefined) {
      return NextResponse.json({ error: 'Floor ID, room number, rent, and capacity are required' }, { status: 400 });
    }
    const newRoom = await dbService.createRoom(
      floorId,
      number,
      type || 'AC Double',
      parseFloat(rent),
      parseInt(capacity),
      amenities || ''
    );
    return NextResponse.json({ success: true, room: newRoom });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, number, type, rent, capacity, status } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    await dbService.updateRoom(id, {
      number,
      type,
      rent: rent !== undefined ? parseFloat(rent) : undefined,
      capacity: capacity !== undefined ? parseInt(capacity) : undefined,
      status
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // Fallback if query param is passed
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    await dbService.deleteRoom(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
