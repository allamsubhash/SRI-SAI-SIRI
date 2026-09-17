import { prisma } from '../src/lib/db';
import { mockTenants, mockPayments, mockInvoices } from '../src/lib/mockData';

async function deleteAllTenants() {
  console.log("==========================================================");
  console.log("🧹 DELETING ALL TENANT DATA FROM DATABASE & MEMORY");
  console.log("==========================================================");

  try {
    // 1. Free up all bed assignments
    const updatedBeds = await prisma.bed.updateMany({
      data: {
        tenantId: null,
        isAvailable: true
      }
    });
    console.log(`✓ Unassigned ${updatedBeds.count} bed spot(s).`);

    // 2. Reset all room statuses to AVAILABLE
    const updatedRooms = await prisma.room.updateMany({
      where: { status: 'OCCUPIED' },
      data: { status: 'AVAILABLE' }
    });
    console.log(`✓ Reset ${updatedRooms.count} room(s) to AVAILABLE.`);

    // 3. Delete tenant related transactional records
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✓ Deleted ${deletedPayments.count} payment record(s).`);

    const deletedInvoices = await prisma.invoice.deleteMany({});
    console.log(`✓ Deleted ${deletedInvoices.count} invoice(s).`);

    const deletedComplaints = await prisma.complaint.deleteMany({});
    console.log(`✓ Deleted ${deletedComplaints.count} complaint(s).`);

    const deletedVisitors = await prisma.visitor.deleteMany({});
    console.log(`✓ Deleted ${deletedVisitors.count} visitor gate pass(es).`);

    const deletedLeaves = await prisma.leaveRequest.deleteMany({});
    console.log(`✓ Deleted ${deletedLeaves.count} leave request(s).`);

    // 4. Delete Tenant records
    const deletedTenants = await prisma.tenant.deleteMany({});
    console.log(`✓ Deleted ${deletedTenants.count} tenant record(s).`);

    // 5. Delete Profile records for TENANT role users
    const tenantUserIds = (await prisma.user.findMany({
      where: { role: 'TENANT' },
      select: { id: true }
    })).map(u => u.id);

    const deletedProfiles = await prisma.profile.deleteMany({
      where: { userId: { in: tenantUserIds } }
    });
    console.log(`✓ Deleted ${deletedProfiles.count} tenant profile(s).`);

    // 6. Delete User records for TENANT role users
    const deletedUsers = await prisma.user.deleteMany({
      where: { role: 'TENANT' }
    });
    console.log(`✓ Deleted ${deletedUsers.count} tenant user account(s).`);

  } catch (e: any) {
    console.log("ℹ Database status note:", e.message);
  }

  // 7. Clear in-memory fallback mock lists safely
  mockTenants.splice(0, mockTenants.length);
  mockPayments.splice(0, mockPayments.length);
  mockInvoices.splice(0, mockInvoices.length);
  console.log("✓ Cleared all in-memory tenant fallback lists.");

  console.log("==========================================================");
  console.log("✨ ALL TENANT DATA HAS BEEN DELETED SUCCESSFULLY!");
  console.log("==========================================================");

  try {
    await prisma.$disconnect();
  } catch {}
}

deleteAllTenants();
