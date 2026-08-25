import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET() {
  try {
    const expenses = await dbService.getExpenses();
    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, amount, category, date, notes } = await request.json();
    if (!title || !amount || !category || !date) {
      return NextResponse.json({ error: 'Title, amount, category, and date are required' }, { status: 400 });
    }
    const newExpense = await dbService.createExpense(title, parseFloat(amount), category, date, notes || '');
    return NextResponse.json({ success: true, expense: newExpense });
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
    await dbService.deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
