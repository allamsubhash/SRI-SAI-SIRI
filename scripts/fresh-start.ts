import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
} catch (e) {}

import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function freshStart() {
  console.log("==========================================================");
  console.log("🧹 EXECUTING COMPLETE FRESH START — PURGING ALL APPLICATION DATA");
  console.log("==========================================================");

  try {
    // 1. Delete transactional data
    const p = await prisma.payment.deleteMany({});
    console.log(`✓ Purged ${p.count} payment record(s).`);

    const inv = await prisma.invoice.deleteMany({});
    console.log(`✓ Purged ${inv.count} invoice(s).`);

    const comp = await prisma.complaint.deleteMany({});
    console.log(`✓ Purged ${comp.count} complaint(s).`);

    const vis = await prisma.visitor.deleteMany({});
    console.log(`✓ Purged ${vis.count} visitor gate pass(es).`);

    const l = await prisma.leaveRequest.deleteMany({});
    console.log(`✓ Purged ${l.count} leave request(s).`);

    const maint = await prisma.maintenance.deleteMany({});
    console.log(`✓ Purged ${maint.count} maintenance record(s).`);

    const exp = await prisma.expense.deleteMany({});
    console.log(`✓ Purged ${exp.count} expense record(s).`);

    const not = await prisma.notice.deleteMany({});
    console.log(`✓ Purged ${not.count} notice(s).`);

    const nr = await prisma.notificationRead.deleteMany({});
    console.log(`✓ Purged ${nr.count} notification read record(s).`);

    // 2. Delete tenant & building hierarchy
    const beds = await prisma.bed.deleteMany({});
    console.log(`✓ Purged ${beds.count} bed(s).`);

    const rooms = await prisma.room.deleteMany({});
    console.log(`✓ Purged ${rooms.count} room(s).`);

    const floors = await prisma.floor.deleteMany({});
    console.log(`✓ Purged ${floors.count} floor(s).`);

    const buildings = await prisma.building.deleteMany({});
    console.log(`✓ Purged ${buildings.count} building(s).`);

    const tenants = await prisma.tenant.deleteMany({});
    console.log(`✓ Purged ${tenants.count} tenant(s).`);

    // 3. Keep only primary owner user
    const ownerUser = await prisma.user.findFirst({
      where: { email: 'owner@srisaisiri.com' }
    });

    const deletedProfiles = await prisma.profile.deleteMany({
      where: ownerUser ? { userId: { not: ownerUser.id } } : {}
    });
    console.log(`✓ Purged ${deletedProfiles.count} non-owner profile(s).`);

    const deletedUsers = await prisma.user.deleteMany({
      where: ownerUser ? { id: { not: ownerUser.id } } : {}
    });
    console.log(`✓ Purged ${deletedUsers.count} non-owner user account(s).`);

    // 4. Ensure primary owner account exists
    if (!ownerUser) {
      const passwordHash = bcrypt.hashSync('password123', 10);
      await prisma.user.create({
        data: {
          id: 'u-owner-001',
          email: 'owner@srisaisiri.com',
          password: passwordHash,
          role: 'OWNER',
          profile: {
            create: {
              id: 'p-owner-001',
              firstName: 'Alok',
              lastName: 'Sharma',
              phone: '+91 98765 43210',
              status: 'ACTIVE'
            }
          }
        }
      });
      console.log('✓ Re-created primary owner account (owner@srisaisiri.com).');
    }

    // 5. Reset QR & System settings
    await prisma.setting.deleteMany({});
    console.log('✓ Purged all QR & system settings.');

    // 6. Reset Guidelines
    await prisma.guideline.deleteMany({});
    await prisma.guideline.createMany({
      data: [
        { title: 'Cleanliness & Hygiene', content: 'Maintain cleanliness in individual rooms and common areas at all times. Keep your surroundings neat and hygienic.', category: 'CLEANLINESS', order: 1, isActive: true },
        { title: 'Visitor Rules', content: 'Visitors are allowed only in the reception lounge area between 9:00 AM and 7:00 PM. Unauthorised visitors are not permitted inside the rooms.', category: 'VISITORS', order: 2, isActive: true },
        { title: 'Rent Payment', content: 'Monthly hostel rent must be settled on or before the 5th of each month. Late payments may attract penalties as per hostel policy.', category: 'PAYMENTS', order: 3, isActive: true },
        { title: 'Safety First', content: 'Follow all safety instructions and do not tamper with fire safety equipment. Inform the management immediately in case of any safety concerns.', category: 'SAFETY', order: 4, isActive: true },
        { title: 'Electrical Appliances', content: 'Switch off all electrical appliances when leaving your room. Do not use high-power appliances without prior permission.', category: 'APPLIANCES', order: 5, isActive: true },
        { title: 'Respect Property', content: 'Take care of hostel property and facilities. Any damage must be reported immediately and may be charged to the concerned student.', category: 'PROPERTY', order: 6, isActive: true },
        { title: 'Maintain Silence', content: 'Keep noise levels low, especially during study hours and at night. Be considerate of your fellow residents.', category: 'SILENCE', order: 7, isActive: true },
        { title: 'Healthy Environment', content: 'Avoid littering. Use dustbins and help keep the hostel clean and green. Let\'s work together for a healthier living space.', category: 'ENVIRONMENT', order: 8, isActive: true },
        { title: 'Be Respectful', content: 'Treat all residents, staff and visitors with kindness and respect. Maintain a friendly and positive environment.', category: 'RESPECT', order: 9, isActive: true }
      ]
    });
    console.log('✓ Initialized default Hostel Guidelines.');

    console.log("==========================================================");
    console.log("✨ DATABASE PURGE COMPLETE — CLEAN SLATE READY!");
    console.log("==========================================================");
  } catch (e: any) {
    console.error("Error during fresh start purge:", e);
  } finally {
    await prisma.$disconnect();
  }
}

freshStart();
