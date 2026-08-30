import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notices = await dbService.getNotices();
    return NextResponse.json(notices, {
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
    const { title, content, target, isEmergency } = await request.json();
    if (!title || !content || !target) {
      return NextResponse.json({ error: 'Title, content, and target are required' }, { status: 400 });
    }
    const newNotice = await dbService.createNotice(title, content, target, !!isEmergency);
    return NextResponse.json({ success: true, notice: newNotice });
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
    await dbService.deleteNotice(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
