import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guest = await dbService.getShortStayGuestById(id);

    if (!guest) {
      return NextResponse.json({ success: false, error: 'Short-stay guest not found.' }, { status: 404 });
    }

    // Fetch previous stay history by matching phone number
    const allGuests = await dbService.getShortStayGuests();
    const stayHistory = allGuests.filter((g: any) => g.phone === guest.phone && g.id !== guest.id);

    return NextResponse.json({
      success: true,
      guest,
      stayHistory
    });
  } catch (error: any) {
    console.error('Error fetching short-stay guest details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
