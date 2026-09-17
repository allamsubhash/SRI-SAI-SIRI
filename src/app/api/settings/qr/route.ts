import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await dbService.getQRPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch QR settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = cookies
      .split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Access denied: Only owner can modify settings' }, { status: 403 });
    }

    let qrCodeUrl: string | undefined;
    let upiId: string | undefined;
    let instructions: string | undefined;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      upiId = (formData.get('upiId') as string) || undefined;
      instructions = (formData.get('instructions') as string) || undefined;
      const file = formData.get('qrFile') as File | null;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const path = await import('path');
        const fs = await import('fs');
        const filename = `qr_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        qrCodeUrl = `/uploads/${filename}`;
      } else if (formData.get('qrCodeUrl')) {
        qrCodeUrl = formData.get('qrCodeUrl') as string;
      }
    } else {
      const body = await request.json();
      qrCodeUrl = body.qrCodeUrl;
      upiId = body.upiId;
      instructions = body.instructions;
    }

    const updated = await dbService.saveQRPaymentSettings({ qrCodeUrl, upiId, instructions });

    return NextResponse.json({
      success: true,
      message: 'QR Payment settings updated successfully',
      settings: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save QR settings' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = cookies
      .split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Access denied: Only owner can delete settings' }, { status: 403 });
    }

    const updated = await dbService.deleteQRPaymentSettings();

    return NextResponse.json({
      success: true,
      message: 'QR code removed successfully',
      settings: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete QR settings' }, { status: 500 });
  }
}
