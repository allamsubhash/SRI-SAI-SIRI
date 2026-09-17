import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    const guidelines = await dbService.getGuidelines();
    const result = includeAll ? guidelines : guidelines.filter((g: any) => g.isActive);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch guidelines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title || !data.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const guideline = await dbService.createGuideline({
      title: data.title,
      content: data.content,
      order: data.order !== undefined ? parseInt(data.order) : 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    return NextResponse.json({ success: true, guideline });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create guideline' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'Guideline ID is required' }, { status: 400 });
    }

    const updated = await dbService.updateGuideline(data.id, {
      title: data.title,
      content: data.content,
      order: data.order !== undefined ? parseInt(data.order) : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined
    });

    return NextResponse.json({ success: true, guideline: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update guideline' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Guideline ID is required' }, { status: 400 });
    }

    await dbService.deleteGuideline(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete guideline' }, { status: 500 });
  }
}
