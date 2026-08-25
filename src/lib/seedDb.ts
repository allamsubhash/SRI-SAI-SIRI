import { PrismaClient } from '@prisma/client';
import * as mock from './mockData';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear database
  await prisma.auditLog.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.salary.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.setting.deleteMany({});

  console.log('Database cleared.');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Owner User
  const ownerUser = await prisma.user.create({
    data: {
      id: 'u-owner-1',
      email: 'owner@srisaisiri.com',
      password: passwordHash,
      role: 'OWNER',
      profile: {
        create: {
          firstName: 'Alok',
          lastName: 'Sharma',
          phone: '+91 99887 76655',
          gender: 'Male',
          address: 'Sector 62, Noida, UP',
          status: 'ACTIVE'
        }
      }
    }
  });
  console.log('Owner user created.');

  // 3. Create Buildings, Floors, Rooms, Beds
  const buildingIdMap = new Map<string, string>();
  const roomIdMap = new Map<string, string>();

  for (const b of mock.mockBuildings) {
    const createdBuilding = await prisma.building.create({
      data: {
        id: b.id,
        name: b.name,
        address: b.address
      }
    });
    buildingIdMap.set(b.id, createdBuilding.id);

    for (const f of b.floors) {
      const createdFloor = await prisma.floor.create({
        data: {
          number: f.number,
          buildingId: createdBuilding.id
        }
      });

      for (const r of f.rooms) {
        const createdRoom = await prisma.room.create({
          data: {
            id: r.id,
            number: r.number,
            type: r.type,
            rent: r.rent,
            capacity: r.capacity,
            status: r.status,
            amenities: r.amenities.join(', '),
            floorId: createdFloor.id
          }
        });
        roomIdMap.set(r.number, createdRoom.id);

        for (const bed of r.beds) {
          await prisma.bed.create({
            data: {
              id: bed.id,
              number: bed.number,
              roomId: createdRoom.id,
              isAvailable: bed.isAvailable
            }
          });
        }
      }
    }
  }
  console.log('Buildings, rooms, and beds created.');

  // 4. Create Tenant Users and Profiles
  const tenantIdMap = new Map<string, string>();

  for (const t of mock.mockTenants) {
    // Create User
    const user = await prisma.user.create({
      data: {
        id: t.userId,
        email: t.email,
        password: passwordHash,
        role: 'TENANT'
      }
    });

    // Create Profile and Tenant
    const firstName = t.name.split(' ')[0] || 'Tenant';
    const lastName = t.name.split(' ').slice(1).join(' ') || '';

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        phone: t.phone,
        gender: t.gender,
        address: t.address,
        aadhaar: t.aadhaar,
        emergencyContactName: t.emergencyName,
        emergencyContactPhone: t.emergencyPhone,
        guardianName: t.guardianName,
        guardianPhone: t.guardianPhone,
        occupation: t.occupation,
        moveInDate: new Date(t.moveInDate),
        status: t.status,
        tenant: {
          create: {
            id: t.id,
            roomNumber: t.roomNumber,
            bedNumber: t.bedNumber,
            rentAmount: t.rentAmount,
            agreementUrl: t.agreementUrl,
            medicalNotes: t.medicalNotes,
            status: t.status,
            moveInDate: new Date(t.moveInDate)
          }
        }
      },
      include: {
        tenant: true
      }
    });

    if (profile.tenant) {
      tenantIdMap.set(t.id, profile.tenant.id);
      
      // Update the bed mapping in Prisma
      await prisma.bed.updateMany({
        where: { number: t.bedNumber },
        data: {
          tenantId: profile.tenant.id,
          isAvailable: false
        }
      });
    }
  }
  console.log('Tenants and profiles created, beds linked.');

  // 5. Create Employees
  for (const emp of mock.mockEmployees) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        name: emp.name,
        phone: emp.phone,
        address: emp.address,
        role: emp.role,
        salary: emp.salary,
        status: emp.status,
        bankDetails: emp.bankDetails,
        emergencyContact: emp.emergencyContact,
        photoUrl: emp.photoUrl,
        joiningDate: new Date(emp.joiningDate)
      }
    });
  }
  console.log('Employees created.');

  // 6. Create Invoices
  for (const inv of mock.mockInvoices) {
    const dbTenantId = tenantIdMap.get(inv.tenantId) || inv.tenantId;
    await prisma.invoice.create({
      data: {
        id: inv.id,
        number: inv.number,
        tenantId: dbTenantId,
        amount: inv.amount,
        paidAmount: inv.paidAmount,
        dueDate: new Date(inv.dueDate),
        status: inv.status,
        itemsJson: JSON.stringify(inv.items),
        createdAt: new Date(inv.dateCreated)
      }
    });
  }
  console.log('Invoices created.');

  // 7. Create Complaints
  console.log('No complaints seeded (empty by default).');

  // 8. Create Notices
  for (const notice of mock.mockNotices) {
    await prisma.notice.create({
      data: {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        target: notice.target,
        isEmergency: notice.isEmergency,
        scheduleDate: new Date(notice.scheduleDate)
      }
    });
  }
  console.log('Notices created.');

  // 9. Create Expenses
  for (const exp of mock.mockExpenses) {
    await prisma.expense.create({
      data: {
        id: exp.id,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        date: new Date(exp.date),
        notes: exp.notes
      }
    });
  }
  console.log('Expenses created.');

  console.log('Database seeding successfully finished!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
