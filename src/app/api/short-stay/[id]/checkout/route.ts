import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedGuest = await dbService.checkoutShortStayGuest(id);

    return NextResponse.json({
      success: true,
      guest: updatedGuest,
      message: 'Guest checked out successfully and room/bed released.'
    });
  } catch (error: any) {
    console.error('Error checking out short-stay guest:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
