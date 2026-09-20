import fs from 'fs';
import path from 'path';

// Pre-load environment variables
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

import { dbService } from '../src/lib/db';
import { calculateBillStatus } from '../src/lib/billingService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runMasterE2EAudit() {
  console.log("=========================================================================");
  console.log("🚀 STARTING COMPLETE MASTER END-TO-END AUDIT & VERIFICATION SUITE");
  console.log("=========================================================================\n");

  // -------------------------------------------------------------------------
  // PHASE 1 & 2: VERIFY CLEAN STATE
  // -------------------------------------------------------------------------
  console.log("--- PHASE 1 & 2: VERIFY CLEAN DATABASE STATE ---");
  const initialBuildings = await dbService.getBuildings();
  const initialTenants = await dbService.getTenants();
  const initialInvoices = await dbService.getInvoices();
  const initialPayments = await dbService.getAllPayments();
  const initialGuests = await dbService.getShortStayGuests();

  assert(initialBuildings.length === 0, "Initial Buildings count MUST be 0");
  assert(initialTenants.length === 0, "Initial Tenants count MUST be 0");
  assert(initialInvoices.length === 0, "Initial Invoices count MUST be 0");
  assert(initialPayments.length === 0, "Initial Payments count MUST be 0");
  assert(initialGuests.length === 0, "Initial Short-Stay Guests count MUST be 0");

  // -------------------------------------------------------------------------
  // PHASE 6, 7, 8: BUILDING, ROOM & BED CREATION & UPDATES
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 6, 7, 8: BUILDING, ROOM & BED MANAGEMENT ---");
  const building = await dbService.createBuilding("Block A", "123 Main St", 2);
  assert(building !== null && building.id !== undefined, "Building Block A created successfully");

  const floorId = (building.floors && building.floors.length > 0) ? building.floors[0].id : `flr-${building.id}-1`;

  const room = await dbService.createRoom(floorId, "A-101", "2 Sharing AC", 8500, 2);
  assert(room !== null && (room.number === "A-101" || room.roomNumber === "A-101"), "Room A-101 created with 2 beds");

  // Edit Building
  const updatedBuilding = await dbService.updateBuilding(building.id, "Block A Updated", "456 New St");
  assert(updatedBuilding.name === "Block A Updated", "Building edit persists updated name");

  // Verify Building Query
  const buildingsList = await dbService.getBuildings();
  assert(buildingsList.length === 1 && buildingsList[0].name === "Block A Updated", "Building query retrieves persisted updated building");

  // -------------------------------------------------------------------------
  // PHASE 9: MONTHLY TENANT REGISTRATION & PROFILE EDIT
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 9: MONTHLY TENANT REGISTRATION & PROFILE EDIT ---");
  const tenant = await dbService.createTenant({
    name: "Test Monthly Tenant",
    email: "tenant.monthly@example.com",
    phone: "+91 98765 00001",
    gender: "Male",
    roomNumber: "A-101",
    bedNumber: "A-101-A",
    rentAmount: 8500,
    moveInDate: new Date().toISOString().split('T')[0]
  });
  assert(tenant !== null && tenant.id !== undefined, "Monthly Tenant created successfully");

  // Verify Bed is now occupied
  const buildingsWithBeds = await dbService.getBuildings();
  let assignedBedIsAvailable = true;
  buildingsWithBeds.forEach((b: any) => {
    b.floors?.forEach((f: any) => {
      f.rooms?.forEach((r: any) => {
        r.beds?.forEach((bed: any) => {
          if (bed.number === "A-101-A") {
            assignedBedIsAvailable = bed.isAvailable;
          }
        });
      });
    });
  });
  assert(assignedBedIsAvailable === false, "Bed A-101-A is marked OCCUPIED (isAvailable = false)");

  // Edit Tenant Profile
  const updatedTenant = await dbService.updateTenantProfile(tenant.id, {
    phone: "+91 98765 99999",
    medicalNotes: "No allergies"
  });
  assert(updatedTenant.id === tenant.id, "Tenant edit preserves exact stable tenant.id");

  const tenantsList = await dbService.getTenants();
  assert(tenantsList.length === 1 && tenantsList[0].phone === "+91 98765 99999", "Tenant phone update persisted");

  // -------------------------------------------------------------------------
  // PHASE 10: SHORT-STAY GUEST REGISTRATION (AMOUNT PAID DEFAULTS TO 0)
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 10: SHORT-STAY GUEST REGISTRATION ---");
  const todayStr = new Date().toISOString().split('T')[0];
  const fourDaysLater = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];

  const guest = await dbService.createShortStayGuest({
    name: "Test Short Stay",
    phone: "+91 99999 11111",
    checkInDate: todayStr,
    expectedCheckOutDate: fourDaysLater,
    numberOfDays: 4,
    dailyRent: 600,
    amountPaid: 0, // MUST default to 0
    paymentMethod: "CASH"
  });

  assert(guest.totalAmount === 2400, "Short-Stay Total Amount calculated as 4 * 600 = ₹2,400");
  assert(guest.amountPaid === 0, "Short-Stay Amount Paid defaults to ₹0 (NOT full stay amount)");
  assert(guest.balance === 2400, "Short-Stay Balance equals ₹2,400");
  assert(guest.paymentStatus === "PENDING", "Short-Stay Payment Status is PENDING");

  // -------------------------------------------------------------------------
  // PHASE 11, 12, 13, 15: TENANT PAYMENT SUBMISSION, VERIFICATION & RECEIPT
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 11, 12, 13, 15: PAYMENT SUBMISSION & VERIFICATION QUEUE ---");
  
  // Step 1: Initial Billing Summary
  let summary = await dbService.getTenantFinancialSummary(tenant.id);
  assert(summary.totalRent === 8500, "Step 1: Total Due is ₹8,500");
  assert(summary.totalVerifiedPaid === 0, "Step 1: Verified Paid is ₹0");
  assert(summary.pendingVerification === 0, "Step 1: Pending Verification is ₹0");
  assert(summary.balance === 8500, "Step 1: Balance is ₹8,500");
  assert(summary.paymentStatus === "DUE" || summary.paymentStatus === "PENDING" || summary.paymentStatus === "OVERDUE", "Step 1: Status is DUE / PENDING / OVERDUE");

  // Step 2: Tenant Submits Partial Payment ₹3,000
  const sub1 = await dbService.submitTenantPayment({
    tenantId: tenant.id,
    amount: 3000,
    paymentMethod: "UPI",
    referenceId: "UTR-123456"
  });
  assert(sub1.status === "PENDING_VERIFICATION", "Step 2: Tenant submission enters PENDING_VERIFICATION queue");

  // Verify Billing Summary while payment is PENDING_VERIFICATION
  summary = await dbService.getTenantFinancialSummary(tenant.id);
  assert(summary.totalVerifiedPaid === 0, "Step 2: Verified Paid remains ₹0 before Owner approval");
  assert(summary.pendingVerification === 3000, "Step 2: Pending Verification shows ₹3,000");
  assert(summary.balance === 8500, "Step 2: Balance remains ₹8,500 before Owner approval");

  // Step 3: Owner Approves Partial Payment ₹3,000
  const app1 = await dbService.approveTenantPayment(sub1.id);
  assert(app1.status === "APPROVED" || app1.status === "VERIFIED", "Step 3: Payment approved by Owner");

  summary = await dbService.getTenantFinancialSummary(tenant.id);
  assert(summary.totalVerifiedPaid === 3000, "Step 3: Verified Paid updated to ₹3,000");
  assert(summary.pendingVerification === 0, "Step 3: Pending Verification reset to ₹0");
  assert(summary.balance === 5500, "Step 3: Balance reduced to ₹5,500");
  assert(summary.paymentStatus === "PARTIALLY_PAID" || summary.paymentStatus === "PARTIAL" || summary.paymentStatus === "OVERDUE", "Step 3: Status updated to PARTIALLY_PAID / PARTIAL / OVERDUE");

  // Verify Receipt Math for Partial Payment
  const tenantPayments1 = (await dbService.getAllPayments()).filter((p: any) => p.tenantId === tenant.id && (p.status === 'APPROVED' || p.status === 'VERIFIED' || p.status === 'PAID'));
  assert(tenantPayments1.length >= 1, "Step 3: Receipt generated after approval");
  const rec1 = tenantPayments1[0];
  assert(rec1.amount === 3000, "Receipt 1: Amount Paid = ₹3,000");

  // Step 4: Tenant Submits Final Settlement ₹5,500
  const sub2 = await dbService.submitTenantPayment({
    tenantId: tenant.id,
    amount: 5500,
    paymentMethod: "BANK_TRANSFER",
    referenceId: "IMPS-987654"
  });
  assert(sub2.status === "PENDING_VERIFICATION", "Step 4: Second submission enters PENDING_VERIFICATION");

  const app2 = await dbService.approveTenantPayment(sub2.id);
  assert(app2.status === "APPROVED" || app2.status === "VERIFIED", "Step 4: Second payment approved");

  summary = await dbService.getTenantFinancialSummary(tenant.id);
  assert(summary.totalVerifiedPaid === 8500, "Step 4: Total Verified Paid is ₹8,500");
  assert(summary.balance === 0, "Step 4: Remaining Balance is EXACTLY ₹0");
  assert(summary.paymentStatus === "PAID", "Step 4: Status is ✓ PAID");

  // Verify Final Receipts
  const tenantPayments2 = (await dbService.getAllPayments()).filter((p: any) => p.tenantId === tenant.id && (p.status === 'APPROVED' || p.status === 'VERIFIED' || p.status === 'PAID'));
  assert(tenantPayments2.length === 2, "Final Receipts: Exactly 2 verified payment records exist");

  // -------------------------------------------------------------------------
  // PHASE 10 (CONT): SHORT-STAY PAYMENT & SETTLEMENT
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 10 (CONT): SHORT-STAY PAYMENT & CHECKOUT ---");
  // Pay initial installment of ₹600
  const ssPay1 = await dbService.addShortStayPayment({
    guestId: guest.id,
    amount: 600,
    paymentMethod: "CASH",
    receivedBy: "Hostel Owner"
  });
  assert(ssPay1.amount === 600, "Short-Stay Payment 1 recorded: ₹600");

  let guestInfo = await dbService.getShortStayGuestById(guest.id);
  assert(guestInfo.amountPaid === 600, "Short-Stay Paid updated to ₹600");
  assert(guestInfo.balance === 1800, "Short-Stay Balance updated to ₹1,800");
  assert(guestInfo.paymentStatus === "PARTIALLY_PAID", "Short-Stay Status updated to PARTIALLY_PAID");

  // Pay remaining ₹1,800
  const ssPay2 = await dbService.addShortStayPayment({
    guestId: guest.id,
    amount: 1800,
    paymentMethod: "UPI",
    receivedBy: "Hostel Owner"
  });
  assert(ssPay2.amount === 1800, "Short-Stay Payment 2 recorded: ₹1,800");

  guestInfo = await dbService.getShortStayGuestById(guest.id);
  assert(guestInfo.amountPaid === 2400, "Short-Stay Paid updated to ₹2,400");
  assert(guestInfo.balance === 0, "Short-Stay Balance updated to EXACTLY ₹0");
  assert(guestInfo.paymentStatus === "PAID", "Short-Stay Status updated to ✓ PAID");

  // Check-out Short-Stay guest
  const checkoutRes = await dbService.checkoutShortStayGuest(guest.id);
  assert(checkoutRes.status === "CHECKED_OUT", "Short-Stay guest successfully CHECKED_OUT");

  // -------------------------------------------------------------------------
  // PHASE 24, 25, 26: REMINDERS & REFRESH PERSISTENCE
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 24, 25, 26: REMINDERS & PERSISTENCE VERIFICATION ---");
  const tenantInvoices = (await dbService.getInvoices()).filter((i: any) => i.tenantId === tenant.id);
  assert(tenantInvoices.length >= 1, "Tenant invoice found for reminder check");
  let caughtReminderError = false;
  try {
    await dbService.sendPaymentReminder({
      invoiceId: tenantInvoices[0].id,
      reminderType: "Overdue",
      channel: "WhatsApp"
    });
  } catch (err: any) {
    if (err.message?.includes("already fully paid")) {
      caughtReminderError = true;
    }
  }
  assert(caughtReminderError === true, "System MUST reject sending payment reminders to fully paid tenants (Outstanding: ₹0)");

  // Query fresh workspace state
  const finalBuildings = await dbService.getBuildings();
  const finalTenants = await dbService.getTenants();
  const finalInvoices = await dbService.getInvoices();
  const finalPayments = await dbService.getAllPayments();

  assert(finalBuildings.length === 1, "Persisted Buildings count is 1");
  assert(finalTenants.length === 1, "Persisted Tenants count is 1");
  assert(finalInvoices.length >= 1, "Persisted Invoices present");
  assert(finalPayments.length === 2, "Persisted verified payments count is EXACTLY 2");

  console.log("\n=========================================================================");
  console.log("✨ MASTER END-TO-END AUDIT SUITE PASSED 100% — ALL INVARIANTS VERIFIED!");
  console.log("=========================================================================\n");
}

runMasterE2EAudit()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Fatal Error in E2E Audit:", e);
    process.exit(1);
  });
