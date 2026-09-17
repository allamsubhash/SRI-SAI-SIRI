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
    console.log('✓ Purged all QR & system settings (0 settings remaining).');

    // 6. Reset Guidelines
    await prisma.guideline.deleteMany({});
    console.log('✓ Purged all Hostel Guidelines (0 guidelines remaining).');

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
