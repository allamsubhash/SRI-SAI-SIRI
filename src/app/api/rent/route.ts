import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const invoices = await dbService.getInvoices();
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId, amount, items, dueDate } = await request.json();
    if (!tenantId || !amount || !items || !dueDate) {
      return NextResponse.json({ error: 'Tenant ID, amount, items breakdown, and due date are required' }, { status: 400 });
    }
    const newInvoice = await dbService.createInvoice(tenantId, amount, items, dueDate);
    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { invoiceId, amountPaid, method, action, isTenantPayment, remarks, amount, dueDate, status } = await request.json();
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    if (action === 'VERIFY') {
      const updatedInvoice = await dbService.verifyInvoicePayment(invoiceId, remarks || 'Payment verified by owner');
      return NextResponse.json({ success: true, invoice: updatedInvoice });
    }

    if (action === 'REVERT') {
      const updatedInvoice = await dbService.revertInvoicePayment(invoiceId, remarks || 'Payment reverted by owner');
      return NextResponse.json({ success: true, invoice: updatedInvoice });
    }

    if (action === 'UPDATE') {
      const updatedInvoice = await dbService.updateInvoice(invoiceId, { amount, dueDate, status });
      return NextResponse.json({ success: true, invoice: updatedInvoice });
    }

    if (!amountPaid || !method) {
      return NextResponse.json({ error: 'Amount paid and payment method are required' }, { status: 400 });
    }

    const updatedInvoice = await dbService.recordPayment(invoiceId, parseFloat(amountPaid), method, !!isTenantPayment);
    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { invoiceId } = await request.json();
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    const deleted = await dbService.deleteInvoice(invoiceId);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
