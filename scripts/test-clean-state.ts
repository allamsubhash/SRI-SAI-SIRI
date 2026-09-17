import { dbService } from '../src/lib/db';

async function testCleanState() {
  const b = await dbService.getBuildings();
  const t = await dbService.getTenants();
  const i = await dbService.getInvoices();
  const p = await dbService.getAllPayments();
  const g = await dbService.getGuidelines();
  const qr = await dbService.getQRPaymentSettings();

  console.log('--- CLEAN STATE VERIFICATION ---');
  console.log('BUILDINGS:', b.length);
  console.log('TENANTS:', t.length);
  console.log('INVOICES:', i.length);
  console.log('PAYMENTS:', p.length);
  console.log('GUIDELINES:', g.length);
  console.log('QR SETTINGS:', qr);
}

testCleanState().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
