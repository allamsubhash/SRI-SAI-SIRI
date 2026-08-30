import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await dbService.getInventory();
    return NextResponse.json(items, {
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
    const { name, category, quantity, condition, purchaseDate, cost, warrantyYears, vendor } = await request.json();
    if (!name || !category || quantity === undefined || !condition || !purchaseDate || cost === undefined) {
      return NextResponse.json({ error: 'Name, category, quantity, condition, purchase date, and cost are required' }, { status: 400 });
    }
    const newItem = await dbService.createInventoryItem(
      name, 
      category, 
      parseInt(quantity), 
      condition, 
      purchaseDate, 
      parseFloat(cost), 
      parseInt(warrantyYears || 0), 
      vendor || ''
    );
    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, quantity, condition } = await request.json();
    if (!id || quantity === undefined || !condition) {
      return NextResponse.json({ error: 'Item ID, quantity, and condition are required' }, { status: 400 });
    }
    const updated = await dbService.updateInventoryItem(id, parseInt(quantity), condition);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await dbService.deleteInventory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
