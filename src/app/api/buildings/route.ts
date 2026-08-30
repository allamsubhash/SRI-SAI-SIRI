import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buildings = await dbService.getBuildings();
    return NextResponse.json(buildings, {
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
    const body = await request.json();
    const name = body.name;
    const address = body.address;
    const floors = body.floors || body.floorsCount;

    if (!name || !address || !floors) {
      return NextResponse.json({ error: 'Name, address, and floors count are required' }, { status: 400 });
    }
    const newBuilding = await dbService.createBuilding(name, address, parseInt(floors));
    return NextResponse.json({ success: true, building: newBuilding });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, address } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 });
    }
    await dbService.updateBuilding(id, { name, address });
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
        // Body reading fallback if query param is missing
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 });
    }
    await dbService.deleteBuilding(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
