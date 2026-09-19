import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMethod, receivedBy, notes } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Payment amount must be greater than 0.' }, { status: 400 });
    }

    const updatedGuest = await dbService.addShortStayPayment(id, {
      amount: Number(amount),
      paymentMethod: paymentMethod || 'CASH',
      receivedBy: receivedBy || 'Hostel Manager',
      notes
    });

    return NextResponse.json({
      success: true,
      guest: updatedGuest
    });
  } catch (error: any) {
    console.error('Error adding short-stay payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
