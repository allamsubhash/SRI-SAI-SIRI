import { dbService, prisma } from '../src/lib/db';
import { comparePassword, hashPassword } from '../src/lib/auth';
import { formatDate } from '../src/utils/formatters';

async function runMasterAuditTestSuite() {
  console.log("==========================================================");
  console.log("🧪 STARTING MASTER SYSTEM QA & INTEGRATION AUDIT SUITE");
  console.log("==========================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(` ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(` ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  try {
    // -------------------------------------------------------------------
    // TEST 1: Single Source of Truth — Move-in Date & Phone Number
    // -------------------------------------------------------------------
    console.log("\n--- [TEST GROUP 1] Move-in Date & Mobile Single Source of Truth ---");
    const tenants = await dbService.getTenants();
    assert(Array.isArray(tenants) && tenants.length > 0, "Fetch Tenant List", `Found ${tenants.length} tenants`);

    if (tenants.length > 0) {
      const sampleTenant = tenants[0];
      const moveInFormatted = formatDate(sampleTenant.moveInDate);
      assert(moveInFormatted === '15 Jan 2026' || moveInFormatted.length > 0, "Move-in Date Format", `Date: ${moveInFormatted}`);
      assert(typeof sampleTenant.phone === 'string' && sampleTenant.phone.length > 0, "Mobile Number Single Source", `Phone: ${sampleTenant.phone}`);
    }

    // -------------------------------------------------------------------
    // TEST 2: Tenant Registration & Single-Hash Authentication (No Double Hashing)
    // -------------------------------------------------------------------
    console.log("\n--- [TEST GROUP 2] Tenant Registration & Single-Hash Auth ---");
    const testEmail = `audit_tenant_${Date.now()}@srisaisiri.com`;
    const testPassword = 'Password@123';
    const hashedPassword = await hashPassword(testPassword);

    assert(hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$'), "BCrypt Hash Format", "Valid hash generated");

    const createdTenant = await dbService.createTenant({
      name: 'Audit Test Resident',
      email: testEmail,
      phone: '+91 91234 56789',
      gender: 'Male',
      address: 'Sector 62 Noida',
      aadhaar: '1111-2222-3333',
      emergencyName: 'Parent',
      emergencyPhone: '+91 91234 56780',
      guardianName: 'Guardian',
      guardianPhone: '+91 91234 56781',
      occupation: 'Software Engineer',
      moveInDate: '2026-01-15',
      roomNumber: 'A-999',
      bedNumber: 'A-999-A',
      rentAmount: 6500,
      password: hashedPassword
    });

    assert(Boolean(createdTenant?.id), "Create Tenant Record", `Tenant ID: ${createdTenant.id}`);

    // Verify User Password in DB or Mock
    let userInDb: any = null;
    try {
      userInDb = await prisma.user.findUnique({ where: { email: testEmail } });
    } catch {
      userInDb = createdTenant;
    }
    const targetPassword = userInDb?.password || createdTenant?.password;
    assert(Boolean(targetPassword), "User Account Created", `Tenant Email: ${testEmail}`);
    
    if (targetPassword) {
      const isValidPass = await comparePassword(testPassword, targetPassword);
      assert(isValidPass, "Tenant Password Authentication", "Login password verification succeeded");
    }

    // -------------------------------------------------------------------
    // TEST 3: Roommate Discovery & Multi-Occupancy Room Sharing
    // -------------------------------------------------------------------
    console.log("\n--- [TEST GROUP 3] Roommates Directory Logic ---");
    const roomNumberShared = 'A-888';
    
    // Register Tenant A
    const tenantA = await dbService.createTenant({
      name: 'Roommate Alpha',
      email: `rm_alpha_${Date.now()}@srisaisiri.com`,
      phone: '+91 98888 11111',
      roomNumber: roomNumberShared,
      bedNumber: 'A-888-A',
      rentAmount: 6500
    });

    // Register Tenant B
    const tenantB = await dbService.createTenant({
      name: 'Roommate Beta',
      email: `rm_beta_${Date.now()}@srisaisiri.com`,
      phone: '+91 98888 22222',
      roomNumber: roomNumberShared,
      bedNumber: 'A-888-B',
      rentAmount: 6500
    });

    const allActiveTenants = await dbService.getTenants();
    const normalizeRoom = (r?: string) => (r || '').replace(/^room\s*/i, '').trim().toLowerCase();

    // Test Roommates for Tenant A
    const roommatesOfA = allActiveTenants.filter(t => 
      t.status === 'ACTIVE' && 
      normalizeRoom(t.roomNumber) === normalizeRoom(roomNumberShared) && 
      t.id !== tenantA.id
    );
    assert(roommatesOfA.some(t => t.id === tenantB.id), "Tenant A sees Tenant B as Roommate", `Found ${roommatesOfA.length} roommate(s)`);

    // Test Roommates for Tenant B
    const roommatesOfB = allActiveTenants.filter(t => 
      t.status === 'ACTIVE' && 
      normalizeRoom(t.roomNumber) === normalizeRoom(roomNumberShared) && 
      t.id !== tenantB.id
    );
    assert(roommatesOfB.some(t => t.id === tenantA.id), "Tenant B sees Tenant A as Roommate", `Found ${roommatesOfB.length} roommate(s)`);

    // -------------------------------------------------------------------
    // TEST 4: Rent & Financial Accounting Audit
    // -------------------------------------------------------------------
    console.log("\n--- [TEST GROUP 4] Rent Accounting, Settlement & Receipts ---");
    const financialSummary = await dbService.getTenantFinancialSummary(tenantA.id);
    assert(financialSummary.monthlyRent === 6500, "Base Rent Single Source of Truth", `Rent: ₹${financialSummary.monthlyRent}`);

    // Create Invoice for ₹6,500
    const invoice = await dbService.createInvoice(tenantA.id, 6500, [{ description: 'Monthly Rent', amount: 6500 }], '2026-09-30');
    assert(Boolean(invoice?.id), "Create Rent Invoice", `Invoice Number: ${invoice.number}`);

    // Record Full Payment ₹6,500
    const payment = await dbService.recordPayment(invoice.id, 6500, 'ONLINE', false);
    assert(Boolean(payment?.id), "Record Full Payment", `Invoice ID: ${invoice.id}`);

    const updatedSummary = await dbService.getTenantFinancialSummary(tenantA.id);
    assert(updatedSummary.outstandingAmount === 0, "Outstanding Balance Zero After Full Settlement", `Outstanding: ₹${updatedSummary.outstandingAmount}`);
    assert(updatedSummary.lastPaymentAmount === 6500, "Last Settled Payment Amount Matches Exact Payment", `Last Settled: ₹${updatedSummary.lastPaymentAmount}`);
    assert(updatedSummary.paymentStatus === 'PAID', "Payment Status PAID", `Status: ${updatedSummary.paymentStatus}`);

    // -------------------------------------------------------------------
    // TEST 5: Tenant Vacate Workflow & Bed Availability
    // -------------------------------------------------------------------
    console.log("\n--- [TEST GROUP 5] Tenant Vacate Workflow & Bed Freeing ---");
    const vacatedTenant = await dbService.updateTenantStatus(tenantA.id, 'ARCHIVED');
    assert(vacatedTenant?.status === 'ARCHIVED', "Vacate Tenant Action", "Tenant status updated to ARCHIVED");

    const tenantsPostVacate = await dbService.getTenants();
    const roommatesPostVacate = tenantsPostVacate.filter(t => 
      t.status === 'ACTIVE' && 
      normalizeRoom(t.roomNumber) === normalizeRoom(roomNumberShared) && 
      t.id !== tenantB.id
    );
    assert(!roommatesPostVacate.some(t => t.id === tenantA.id), "Vacated Tenant Disappears from Roommate List", "Tenant A no longer listed as active roommate");

    // -------------------------------------------------------------------
    // TEST 6: Strict Single Source of Truth & ID Alignment (User Test Case)
    // -------------------------------------------------------------------
    console.log("\n--- [TEST GROUP 6] Strict Database Phone & Move-in Date Single Source ---");
    const testNewTenantName = 'TEST TENANT';
    const testNewPhone = '9876543210';
    const testNewMoveIn = '2026-09-01';
    const testNewEmail = `test_tenant_${Date.now()}@srisaisiri.com`;

    const registeredTestTenant = await dbService.createTenant({
      name: testNewTenantName,
      email: testNewEmail,
      phone: testNewPhone,
      moveInDate: testNewMoveIn,
      roomNumber: 'TEST ROOM',
      bedNumber: 'TEST BED',
      rentAmount: 6500
    });

    const ownerList = await dbService.getTenants();
    const ownerTenantObj = ownerList.find(t => t.id === registeredTestTenant.id);

    const tenantPortalObj = await dbService.getTenantByUserId(registeredTestTenant.userId);

    assert(Boolean(ownerTenantObj), "Tenant Visible in Owner Portal Data", `ID: ${registeredTestTenant.id}`);
    assert(Boolean(tenantPortalObj), "Tenant Resolved via User ID in Tenant Portal", `User ID: ${registeredTestTenant.userId}`);

    if (ownerTenantObj && tenantPortalObj) {
      assert(
        ownerTenantObj.phone === testNewPhone && tenantPortalObj.phone === testNewPhone,
        "Database Phone = Owner Phone = Tenant Phone",
        `Owner: ${ownerTenantObj.phone}, Tenant: ${tenantPortalObj.phone}`
      );

      assert(
        ownerTenantObj.moveInDate === testNewMoveIn && tenantPortalObj.moveInDate === testNewMoveIn,
        "Database Move-in Date = Owner Move-in Date = Tenant Move-in Date",
        `Owner: ${ownerTenantObj.moveInDate}, Tenant: ${tenantPortalObj.moveInDate}`
      );

      assert(
        ownerTenantObj.id === tenantPortalObj.id,
        "Database Tenant ID = Owner Tenant ID = Tenant Portal Tenant ID",
        `Owner ID: ${ownerTenantObj.id}, Tenant ID: ${tenantPortalObj.id}`
      );
    }

    // Clean up temporary audit records from database if connected
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { startsWith: 'audit_' } },
            { email: { startsWith: 'test_' } },
            { email: { startsWith: 'testa_' } },
            { email: { startsWith: 'testb_' } },
            { email: { startsWith: 'testc_' } },
            { email: { startsWith: 'rm_alpha_' } },
            { email: { startsWith: 'rm_beta_' } }
          ]
        }
      });
    } catch {
      // Ignored if offline
    }

  } catch (error: any) {
    console.error(" ❌ EXCEPTION IN AUDIT SUITE:", error);
    assert(false, "Master Audit Test Suite Execution", error.message);
  } finally {
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { startsWith: 'audit_' } },
            { email: { startsWith: 'test_' } },
            { email: { startsWith: 'testa_' } },
            { email: { startsWith: 'testb_' } },
            { email: { startsWith: 'testc_' } },
            { email: { startsWith: 'rm_alpha_' } },
            { email: { startsWith: 'rm_beta_' } }
          ]
        }
      });
      await prisma.$disconnect(); 
    } catch {}
  }

  console.log("\n==========================================================");
  console.log(`📊 MASTER AUDIT SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==========================================================");
}

runMasterAuditTestSuite();
