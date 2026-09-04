import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Avoid multiple PrismaClient instances in development / serverless executions
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
globalForPrisma.prisma = prisma;

function logDebug(message: string, error?: any) {
  console.log(`[Sri Sai Siri DB Service] ${message}`, error ? error.message || error : '');
}

// Idempotent initial setup helper (creates default owner if no users exist in MySQL DB)
async function ensureDbInitialized() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logDebug("Database user count is 0. Performing initial idempotent owner setup...");
      const passwordHash = bcrypt.hashSync('password123', 10);
      await prisma.user.upsert({
        where: { email: 'owner@srisaisiri.com' },
        update: {}, // DO NOT overwrite existing user password if already present
        create: {
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
    }
  } catch (e) {
    logDebug("ensureDbInitialized warning (will retry on active DB connection)", e);
  }
}

// ensureDbInitialized is called on demand during user login if needed

export const dbService = {
  // --- AUTHENTICATION ---
  async getUserByEmail(email: string) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
      include: {
        profile: {
          include: {
            tenant: true
          }
        }
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : 'User',
      tenantId: user.profile?.tenant?.id || null
    };
  },

  async registerUser(userData: { id?: string; email: string; password?: string; role: 'OWNER' | 'TENANT'; name: string }) {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return {
        id: existing.id,
        email: existing.email,
        role: existing.role,
        name: userData.name
      };
    }

    const passwordHash = userData.password || bcrypt.hashSync('password123', 10);
    const userId = userData.id || `u-${Date.now()}`;
    const names = userData.name.trim().split(' ');
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || '';

    const createdUser = await prisma.user.create({
      data: {
        id: userId,
        email: cleanEmail,
        password: passwordHash,
        role: userData.role,
        profile: {
          create: {
            firstName,
            lastName,
            phone: '+91 98765 43210',
            status: 'ACTIVE'
          }
        }
      },
      include: { profile: true }
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      name: `${createdUser.profile?.firstName || ''} ${createdUser.profile?.lastName || ''}`.trim()
    };
  },

  async updateUserPassword(email: string, newPassword: string) {
    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    const updated = await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: passwordHash },
      include: { profile: true }
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      name: updated.profile ? `${updated.profile.firstName} ${updated.profile.lastName}`.trim() : 'User'
    };
  },

  // --- BUILDINGS ---
  async getBuildings() {
    const dbBuildings = await prisma.building.findMany({
      include: {
        floors: {
          orderBy: { number: 'asc' },
          include: {
            rooms: {
              orderBy: { number: 'asc' },
              include: {
                beds: {
                  include: {
                    tenant: {
                      include: {
                        profile: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return dbBuildings.map(b => ({
      id: b.id,
      name: b.name,
      address: b.address,
      floors: b.floors.map(f => ({
        id: f.id,
        number: f.number,
        rooms: f.rooms.map(r => {
          let amenitiesList: string[] = [];
          try {
            amenitiesList = r.amenities ? r.amenities.split(',').map((a: string) => a.trim()) : [];
          } catch (e) {
            amenitiesList = [];
          }

          let imagesList: string[] = [];
          try {
            imagesList = r.images ? JSON.parse(r.images) : [];
          } catch (e) {
            imagesList = [];
          }

          return {
            id: r.id,
            number: r.number,
            type: r.type,
            rent: r.rent,
            status: r.status as any,
            capacity: r.capacity,
            amenities: amenitiesList,
            images: imagesList,
            beds: r.beds.map(bed => {
              let tenantName: string | undefined = undefined;
              if (bed.tenant && bed.tenant.profile) {
                tenantName = `${bed.tenant.profile.firstName} ${bed.tenant.profile.lastName}`.trim();
              }
              return {
                id: bed.id,
                number: bed.number,
                roomId: bed.roomId,
                tenantId: bed.tenantId,
                isAvailable: bed.isAvailable,
                tenantName
              };
            })
          };
        })
      }))
    }));
  },

  async createBuilding(name: string, address: string, floorsCount: number) {
    return await prisma.building.create({
      data: {
        name,
        address,
        floors: {
          create: Array.from({ length: floorsCount }).map((_, i) => ({
            number: i + 1
          }))
        }
      },
      include: {
        floors: {
          include: { rooms: true }
        }
      }
    });
  },

  async updateBuilding(buildingId: string, data: { name?: string; address?: string }) {
    return await prisma.building.update({
      where: { id: buildingId },
      data
    });
  },

  async deleteBuilding(buildingId: string) {
    // Safeguard: Check if any active tenants reside in this building before allowing delete
    const activeTenantsInBuilding = await prisma.tenant.count({
      where: {
        beds: {
          some: {
            room: {
              floor: {
                buildingId: buildingId
              }
            }
          }
        },
        status: 'ACTIVE'
      }
    });

    if (activeTenantsInBuilding > 0) {
      throw new Error(`Cannot delete building while active residents are assigned to its rooms. Please reassign or relocate residents first.`);
    }

    return await prisma.building.delete({
      where: { id: buildingId }
    });
  },

  // --- ROOMS ---
  async createRoom(floorId: string, number: string, type: string, rent: number, capacity: number, amenities: string) {
    return await prisma.room.create({
      data: {
        number,
        type,
        rent,
        capacity,
        amenities,
        floorId,
        status: 'AVAILABLE',
        beds: {
          create: Array.from({ length: capacity }).map((_, i) => ({
            number: `${number}-${String.fromCharCode(65 + i)}`,
            isAvailable: true
          }))
        }
      },
      include: { beds: true }
    });
  },

  async updateRoom(roomId: string, data: { number?: string; type?: string; rent?: number; capacity?: number; status?: string }) {
    return await prisma.room.update({
      where: { id: roomId },
      data: {
        number: data.number,
        type: data.type,
        rent: data.rent,
        capacity: data.capacity,
        status: data.status
      }
    });
  },

  async deleteRoom(roomId: string) {
    return await prisma.room.delete({
      where: { id: roomId }
    });
  },

  // --- TENANTS ---
  async getTenants() {
    const dbTenants = await prisma.tenant.findMany({
      include: {
        profile: {
          include: {
            user: true
          }
        },
        beds: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return dbTenants.map(t => {
      const assignedBed = t.beds && t.beds.length > 0 ? t.beds[0] : null;
      return {
        id: t.id,
        userId: t.profile.userId,
        name: `${t.profile.firstName} ${t.profile.lastName}`.trim(),
        email: t.profile.user.email,
        phone: t.profile.phone,
        roomNumber: t.roomNumber || 'N/A',
        bedNumber: assignedBed ? assignedBed.number : (t.bedNumber || 'N/A'),
        rentAmount: t.rentAmount || 8500,
        status: t.status as any,
        moveInDate: t.moveInDate ? t.moveInDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        gender: t.profile.gender || 'Male',
        aadhaar: t.profile.aadhaar || '',
        address: t.profile.address || '',
        emergencyName: t.profile.emergencyContactName || '',
        emergencyPhone: t.profile.emergencyContactPhone || '',
        guardianName: t.profile.guardianName || '',
        guardianPhone: t.profile.guardianPhone || '',
        occupation: t.profile.occupation || 'Student',
        medicalNotes: t.medicalNotes || '',
        agreementUrl: t.agreementUrl || '',
        photoUrl: t.profile.photoUrl || ''
      };
    });
  },

  async createTenant(data: {
    name: string;
    email: string;
    phone: string;
    gender?: string;
    address?: string;
    aadhaar?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    guardianName?: string;
    guardianPhone?: string;
    occupation?: string;
    moveInDate?: string;
    roomNumber?: string;
    bedNumber?: string;
    rentAmount?: number;
    agreementUrl?: string;
    medicalNotes?: string;
    photoUrl?: string;
    password?: string;
  }) {
    const cleanEmail = data.email.trim().toLowerCase();
    const userId = `u-tenant-${Date.now()}`;
    const tenantId = `t-${Date.now()}`;
    const profileId = `p-${Date.now()}`;
    const isAlreadyHashed = data.password && (data.password.startsWith('$2a$') || data.password.startsWith('$2b$') || data.password.startsWith('$2y$'));
    const passwordHash = data.password ? (isAlreadyHashed ? data.password : bcrypt.hashSync(data.password, 10)) : bcrypt.hashSync('password123', 10);

    const names = data.name.trim().split(' ');
    const firstName = names[0] || 'Tenant';
    const lastName = names.slice(1).join(' ') || '';

    // ACID Transaction: Create User + Profile + Tenant + Book Bed
    return await prisma.$transaction(async (tx) => {
      // 1. If bedNumber provided, verify bed availability
      let targetBedId: string | null = null;
      if (data.bedNumber) {
        const targetBed = await tx.bed.findFirst({
          where: {
            number: { equals: data.bedNumber.trim() }
          }
        });
        if (targetBed) {
          if (!targetBed.isAvailable) {
            throw new Error(`Bed spot '${data.bedNumber}' is already occupied. Please select an available bed.`);
          }
          targetBedId = targetBed.id;
        }
      }

      // 2. Create User record
      const createdUser = await tx.user.create({
        data: {
          id: userId,
          email: cleanEmail,
          password: passwordHash,
          role: 'TENANT'
        }
      });

      // 3. Create Profile & Tenant records
      const createdProfile = await tx.profile.create({
        data: {
          id: profileId,
          userId: createdUser.id,
          firstName,
          lastName,
          phone: data.phone || '+91 98765 43210',
          gender: data.gender || 'Male',
          address: data.address || '',
          aadhaar: data.aadhaar || '',
          emergencyContactName: data.emergencyName || '',
          emergencyContactPhone: data.emergencyPhone || '',
          guardianName: data.guardianName || '',
          guardianPhone: data.guardianPhone || '',
          occupation: data.occupation || 'Student',
          moveInDate: data.moveInDate ? new Date(data.moveInDate) : new Date(),
          photoUrl: data.photoUrl || '',
          status: 'ACTIVE'
        }
      });

      const createdTenant = await tx.tenant.create({
        data: {
          id: tenantId,
          profileId: createdProfile.id,
          roomNumber: data.roomNumber || 'N/A',
          bedNumber: data.bedNumber || 'N/A',
          rentAmount: data.rentAmount || 8500,
          agreementUrl: data.agreementUrl || '',
          medicalNotes: data.medicalNotes || '',
          moveInDate: data.moveInDate ? new Date(data.moveInDate) : new Date(),
          status: 'ACTIVE'
        }
      });

      // 4. Update Bed occupancy in database
      if (targetBedId) {
        await tx.bed.update({
          where: { id: targetBedId },
          data: {
            tenantId: createdTenant.id,
            isAvailable: false
          }
        });
      }

      return {
        id: createdTenant.id,
        userId: createdUser.id,
        name: `${firstName} ${lastName}`.trim(),
        email: cleanEmail,
        phone: data.phone,
        roomNumber: createdTenant.roomNumber,
        bedNumber: createdTenant.bedNumber,
        rentAmount: createdTenant.rentAmount,
        status: 'ACTIVE'
      };
    });
  },

  async updateTenantProfile(tenantId: string, data: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    moveInDate: string;
    password?: string;
    roomNumber?: string;
    bedNumber?: string;
    rentAmount?: number;
  }) {
    const names = data.name.trim().split(' ');
    const firstName = names[0] || 'Tenant';
    const lastName = names.slice(1).join(' ') || '';

    return await prisma.$transaction(async (tx) => {
      const dbTenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: { profile: true }
      });

      if (!dbTenant) throw new Error('Tenant record not found.');

      // Update User email/password if provided
      const userUpdate: any = { email: data.email.trim().toLowerCase() };
      if (data.password) {
        userUpdate.password = bcrypt.hashSync(data.password, 10);
      }
      await tx.user.update({
        where: { id: dbTenant.profile.userId },
        data: userUpdate
      });

      // Update Profile
      await tx.profile.update({
        where: { id: dbTenant.profileId },
        data: {
          firstName,
          lastName,
          phone: data.phone,
          gender: data.gender,
          moveInDate: new Date(data.moveInDate)
        }
      });

      // Handle Bed reallocation if bedNumber changed
      if (data.bedNumber && data.bedNumber !== dbTenant.bedNumber) {
        // Free old bed
        await tx.bed.updateMany({
          where: { tenantId: tenantId },
          data: { tenantId: null, isAvailable: true }
        });

        // Occupy new bed
        const newBed = await tx.bed.findFirst({
          where: { number: { equals: data.bedNumber.trim() } }
        });

        if (newBed) {
          await tx.bed.update({
            where: { id: newBed.id },
            data: { tenantId: tenantId, isAvailable: false }
          });
        }
      }

      // Update Tenant
      return await tx.tenant.update({
        where: { id: tenantId },
        data: {
          roomNumber: data.roomNumber,
          bedNumber: data.bedNumber,
          rentAmount: data.rentAmount
        }
      });
    });
  },

  async updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED') {
    return await prisma.$transaction(async (tx) => {
      if (status !== 'ACTIVE') {
        // Free assigned bed
        await tx.bed.updateMany({
          where: { tenantId: tenantId },
          data: { tenantId: null, isAvailable: true }
        });
      }

      return await tx.tenant.update({
        where: { id: tenantId },
        data: { status }
      });
    });
  },

  async deleteTenant(tenantId: string) {
    return await prisma.$transaction(async (tx) => {
      const dbTenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        include: { profile: true }
      });

      if (dbTenant) {
        // Free assigned beds
        await tx.bed.updateMany({
          where: { tenantId: tenantId },
          data: { tenantId: null, isAvailable: true }
        });

        // Cascade delete User -> Profile -> Tenant
        await tx.user.delete({
          where: { id: dbTenant.profile.userId }
        });
      }

      return true;
    });
  },

  // --- INVOICES & PAYMENTS ---
  async getInvoices() {
    const dbInvoices = await prisma.invoice.findMany({
      include: {
        tenant: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return dbInvoices.map(inv => {
      let itemsList: any[] = [];
      try {
        itemsList = JSON.parse(inv.itemsJson);
        if (!Array.isArray(itemsList)) itemsList = (itemsList as any)?.items || [];
      } catch (e) {
        itemsList = [];
      }

      return {
        id: inv.id,
        number: inv.number,
        tenantId: inv.tenantId,
        tenantName: inv.tenant ? `${inv.tenant.profile.firstName} ${inv.tenant.profile.lastName}`.trim() : 'Resident',
        roomNumber: inv.tenant?.roomNumber || 'N/A',
        amount: inv.amount,
        paidAmount: inv.paidAmount,
        dueDate: inv.dueDate.toISOString().split('T')[0],
        status: inv.status as any,
        items: itemsList,
        dateCreated: inv.createdAt.toISOString().split('T')[0]
      };
    });
  },

  async getTenantFinancialSummary(tenantIdentifier: string) {
    const dbTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantIdentifier },
          { profile: { userId: tenantIdentifier } },
          { profile: { user: { email: tenantIdentifier } } }
        ]
      },
      include: {
        profile: true,
        invoices: { include: { payments: true } }
      }
    });

    if (!dbTenant) {
      return {
        monthlyRent: 0,
        currentInvoiceAmount: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingAmount: 0,
        lastPaymentAmount: 0,
        lastPaymentDate: null,
        paymentStatus: 'PAID'
      };
    }

    const monthlyRent = dbTenant.rentAmount;

    const allInvoices = dbTenant.invoices || [];
    const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const allPaidPayments = await prisma.payment.findMany({
      where: {
        tenantId: dbTenant.id,
        status: 'PAID'
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalPaid = allPaidPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingAmount = Math.max(0, totalInvoiced - totalPaid);

    const mostRecentPayment = allPaidPayments[0] || null;
    const lastPaymentAmount = mostRecentPayment ? mostRecentPayment.amount : 0;
    const lastPaymentDate = mostRecentPayment ? mostRecentPayment.createdAt.toISOString().split('T')[0] : null;

    let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PAID';
    if (outstandingAmount > 0) {
      paymentStatus = totalPaid > 0 ? 'PARTIAL' : 'PENDING';
    }

    return {
      tenantId: dbTenant.id,
      monthlyRent,
      totalInvoiced,
      totalPaid,
      outstandingAmount,
      lastPaymentAmount,
      lastPaymentDate,
      paymentStatus
    };
  },

  async createInvoice(tenantId: string, amount: number, items: { description: string; amount: number }[], dueDate: string) {
    const dbTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { profile: { userId: tenantId } }
        ]
      }
    });

    if (!dbTenant) throw new Error('Tenant not found for invoice creation.');

    const invId = `inv-${Date.now()}`;
    const invNumber = `INV-2026-${String(Date.now()).slice(-4)}`;

    return await prisma.invoice.create({
      data: {
        id: invId,
        number: invNumber,
        tenantId: dbTenant.id,
        amount,
        paidAmount: 0,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        itemsJson: JSON.stringify(items)
      }
    });
  },

  async recordPayment(invoiceId: string, amount: number, method: string, isTenantPayment: boolean = false) {
    return await prisma.$transaction(async (tx) => {
      const dbInv = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { tenant: { include: { profile: true } } }
      });

      if (!dbInv) throw new Error('Invoice record not found.');

      if (isTenantPayment) {
        return await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PENDING_VERIFICATION',
            payments: {
              create: {
                amount,
                type: 'RENT',
                paymentMethod: method,
                status: 'PENDING',
                tenantId: dbInv.tenantId
              }
            }
          }
        });
      } else {
        const newPaid = dbInv.paidAmount + amount;
        const status = newPaid >= dbInv.amount ? 'PAID' : 'PARTIAL';

        // Record income expense entry
        const tenantName = dbInv.tenant ? `${dbInv.tenant.profile.firstName} ${dbInv.tenant.profile.lastName}`.trim() : 'Tenant';
        await tx.expense.create({
          data: {
            title: `Rent collection - ${tenantName} (${dbInv.number})`,
            amount: -amount, // negative expense = income
            category: 'SALARY',
            date: new Date(),
            notes: `Rent received via ${method}`
          }
        });

        return await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaid,
            status,
            payments: {
              create: {
                amount,
                type: 'RENT',
                paymentMethod: method,
                status: 'PAID',
                tenantId: dbInv.tenantId
              }
            }
          }
        });
      }
    });
  },

  async verifyInvoicePayment(invoiceId: string, remarks: string = 'Verified online payment') {
    return await prisma.$transaction(async (tx) => {
      const dbInv = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true, tenant: { include: { profile: true } } }
      });

      if (!dbInv) throw new Error('Invoice not found.');

      const pendingPayment = dbInv.payments.find(p => p.status === 'PENDING');
      const verifyAmount = pendingPayment ? pendingPayment.amount : (dbInv.amount - dbInv.paidAmount);

      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: { status: 'PAID' }
        });
      } else {
        await tx.payment.create({
          data: {
            amount: verifyAmount,
            type: 'RENT',
            paymentMethod: 'ONLINE',
            status: 'PAID',
            tenantId: dbInv.tenantId,
            invoiceId: dbInv.id
          }
        });
      }

      const newPaidAmount = dbInv.paidAmount + verifyAmount;
      const newStatus = newPaidAmount >= dbInv.amount ? 'PAID' : 'PARTIAL';

      const tenantName = dbInv.tenant ? `${dbInv.tenant.profile.firstName} ${dbInv.tenant.profile.lastName}`.trim() : 'Tenant';
      await tx.expense.create({
        data: {
          title: `Rent collection verified - ${tenantName} (${dbInv.number})`,
          amount: -verifyAmount,
          category: 'SALARY',
          date: new Date(),
          notes: remarks
        }
      });

      return await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });
    });
  },

  async revertInvoicePayment(invoiceId: string, remarks: string = 'Payment reverted by owner') {
    return await prisma.$transaction(async (tx) => {
      const dbInv = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      });

      if (!dbInv) throw new Error('Invoice not found.');

      await tx.payment.deleteMany({
        where: { invoiceId }
      });

      return await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: 0,
          status: 'PENDING'
        }
      });
    });
  },

  async deleteInvoice(invoiceId: string) {
    return await prisma.invoice.delete({
      where: { id: invoiceId }
    });
  },

  async updateInvoice(invoiceId: string, data: { amount?: number; dueDate?: string; month?: string; status?: string }) {
    const updatePayload: any = {};
    if (data.amount !== undefined) updatePayload.amount = data.amount;
    if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);
    if (data.status) {
      updatePayload.status = data.status;
      if (data.status === 'PAID') {
        const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (inv) updatePayload.paidAmount = data.amount !== undefined ? data.amount : inv.amount;
      } else if (data.status === 'PENDING') {
        updatePayload.paidAmount = 0;
      }
    }

    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: updatePayload
    });
  },

  // --- EMPLOYEES ---
  async getEmployees() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const employees = await prisma.employee.findMany({
      include: { salaries: true },
      orderBy: { createdAt: 'desc' }
    });

    return employees.map(emp => {
      const isPaidThisMonth = emp.salaries.some(s => new Date(s.date) >= startOfMonth && s.status === 'PAID');
      return {
        id: emp.id,
        name: emp.name,
        phone: emp.phone,
        address: emp.address,
        role: emp.role as any,
        salary: emp.salary,
        status: emp.status as any,
        joiningDate: emp.joiningDate.toISOString().split('T')[0],
        bankDetails: emp.bankDetails || '',
        emergencyContact: emp.emergencyContact || '',
        photoUrl: emp.photoUrl || '',
        pendingSalary: isPaidThisMonth ? 0 : emp.salary,
        advanceTaken: 0,
        isPaidThisMonth
      };
    });
  },

  async createEmployee(employeeData: any) {
    return await prisma.employee.create({
      data: {
        name: employeeData.name,
        phone: employeeData.phone,
        address: employeeData.address || '',
        role: employeeData.role || 'STAFF',
        salary: parseFloat(employeeData.salary || 15000),
        status: 'ACTIVE',
        bankDetails: employeeData.bankDetails || '',
        emergencyContact: employeeData.emergencyContact || '',
        photoUrl: employeeData.photoUrl || '',
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate) : new Date()
      }
    });
  },

  async paySalary(employeeId: string, amount: number, bonus: number, deductions: number, advancePaid: number) {
    return await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.findUnique({ where: { id: employeeId } });
      if (!emp) throw new Error('Employee not found');

      await tx.salary.create({
        data: {
          employeeId,
          amount,
          bonus,
          deductions,
          advancePaid,
          date: new Date(),
          status: 'PAID'
        }
      });

      return await tx.expense.create({
        data: {
          title: `Salary paid to ${emp.name}`,
          amount: amount + bonus - deductions,
          category: 'SALARY',
          date: new Date(),
          notes: `Bonus: ${bonus}, Deductions: ${deductions}, Advance adjustment: ${advancePaid}`
        }
      });
    });
  },

  async updateEmployee(id: string, data: any) {
    return await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        salary: data.salary !== undefined ? parseFloat(data.salary) : undefined,
        status: data.status,
        bankDetails: data.bankDetails
      }
    });
  },

  async deleteEmployee(id: string) {
    return await prisma.employee.delete({ where: { id } });
  },

  // --- COMPLAINTS ---
  async getComplaints() {
    const complaints = await prisma.complaint.findMany({
      include: {
        tenant: { include: { profile: true } },
        assignedEmployee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return complaints.map(comp => ({
      id: comp.id,
      title: comp.title,
      description: comp.description,
      category: comp.category as any,
      status: comp.status as any,
      tenantId: comp.tenantId,
      tenantName: comp.tenant ? `${comp.tenant.profile.firstName} ${comp.tenant.profile.lastName}`.trim() : 'Resident',
      roomNumber: comp.tenant?.roomNumber || 'N/A',
      assignedEmployeeId: comp.assignedEmployeeId,
      assignedEmployeeName: comp.assignedEmployee ? comp.assignedEmployee.name : undefined,
      dateCreated: comp.createdAt.toISOString().split('T')[0]
    }));
  },

  async createComplaint(tenantId: string, title: string, description: string, category: string) {
    const dbTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { profile: { userId: tenantId } }
        ]
      }
    });

    if (!dbTenant) throw new Error('Tenant not found for complaint submission.');

    return await prisma.complaint.create({
      data: {
        title,
        description,
        category,
        tenantId: dbTenant.id,
        status: 'PENDING'
      }
    });
  },

  async updateComplaintStatus(complaintId: string, status: string, employeeId?: string) {
    return await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        assignedEmployeeId: employeeId || undefined
      },
      include: { assignedEmployee: true }
    });
  },

  async deleteComplaint(complaintId: string) {
    return await prisma.complaint.delete({ where: { id: complaintId } });
  },

  // --- LEAVE REQUESTS ---
  async getLeaveRequests() {
    const leaves = await prisma.leaveRequest.findMany({
      include: { tenant: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return leaves.map(l => ({
      id: l.id,
      tenantId: l.tenantId,
      tenantName: l.tenant ? `${l.tenant.profile.firstName} ${l.tenant.profile.lastName}`.trim() : 'Resident',
      roomNumber: l.tenant?.roomNumber || 'N/A',
      startDate: l.startDate.toISOString().split('T')[0],
      endDate: l.endDate.toISOString().split('T')[0],
      reason: l.reason,
      status: l.status as any,
      dateCreated: l.createdAt.toISOString().split('T')[0]
    }));
  },

  async createLeaveRequest(tenantId: string, startDate: string, endDate: string, reason: string) {
    const dbTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { profile: { userId: tenantId } }
        ]
      }
    });

    if (!dbTenant) throw new Error('Tenant not found for leave request.');

    return await prisma.leaveRequest.create({
      data: {
        tenantId: dbTenant.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING'
      }
    });
  },

  async approveLeaveRequest(leaveId: string, status: 'APPROVED' | 'REJECTED') {
    return await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status }
    });
  },

  // --- VISITORS ---
  async getVisitors() {
    const visitors = await prisma.visitor.findMany({
      include: {
        tenant: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return visitors.map(v => ({
      id: v.id,
      name: v.name,
      phone: v.phone,
      personVisiting: v.personVisiting || (v.tenant ? `${v.tenant.profile.firstName} ${v.tenant.profile.lastName}`.trim() : 'Resident'),
      roomNumber: v.tenant?.roomNumber || 'N/A',
      checkIn: v.checkIn.toISOString().replace('T', ' ').slice(0, 16),
      checkOut: v.checkOut ? v.checkOut.toISOString().replace('T', ' ').slice(0, 16) : null,
      approvalStatus: v.approvalStatus as any,
      tenantId: v.tenantId
    }));
  },

  async createVisitorRequest(tenantId: string, name: string, phone: string, personVisiting: string, checkIn: string) {
    const dbTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { profile: { userId: tenantId } }
        ]
      }
    });

    if (!dbTenant) throw new Error('Tenant not found for visitor request.');

    return await prisma.visitor.create({
      data: {
        name,
        phone,
        personVisiting,
        checkIn: new Date(checkIn),
        tenantId: dbTenant.id,
        approvalStatus: 'PENDING'
      }
    });
  },

  async updateVisitorStatus(visitorId: string, status: 'APPROVED' | 'REJECTED' | 'CHECKOUT') {
    const dataPayload: any = {};
    if (status === 'CHECKOUT') {
      dataPayload.checkOut = new Date();
    } else {
      dataPayload.approvalStatus = status;
    }

    return await prisma.visitor.update({
      where: { id: visitorId },
      data: dataPayload
    });
  },

  // --- EXPENSES ---
  async getExpenses() {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });

    return expenses.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category as any,
      date: e.date.toISOString().split('T')[0],
      notes: e.notes || ''
    }));
  },

  async createExpense(title: string, amount: number, category: string, date: string, notes: string) {
    return await prisma.expense.create({
      data: {
        title,
        amount,
        category,
        date: new Date(date),
        notes
      }
    });
  },

  async deleteExpense(id: string) {
    return await prisma.expense.delete({ where: { id } });
  },

  // --- INVENTORY ---
  async getInventory() {
    const inventory = await prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return inventory.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      condition: i.condition,
      purchaseDate: i.purchaseDate.toISOString().split('T')[0],
      cost: i.cost,
      warrantyYears: i.warrantyYears,
      vendor: i.vendor || '',
      replacementDate: i.replacementDate ? i.replacementDate.toISOString().split('T')[0] : null
    }));
  },

  async createInventoryItem(name: string, category: string, quantity: number, condition: string, purchaseDate: string, cost: number, warrantyYears: number, vendor: string) {
    return await prisma.inventory.create({
      data: {
        name,
        category,
        quantity,
        condition,
        purchaseDate: new Date(purchaseDate),
        cost,
        warrantyYears,
        vendor
      }
    });
  },

  async updateInventoryItem(itemId: string, quantity: number, condition: string) {
    return await prisma.inventory.update({
      where: { id: itemId },
      data: { quantity, condition }
    });
  },

  async deleteInventory(id: string) {
    return await prisma.inventory.delete({ where: { id } });
  },

  // --- NOTICES ---
  async getNotices() {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return notices.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      target: n.target as any,
      isEmergency: n.isEmergency,
      scheduleDate: n.scheduleDate ? n.scheduleDate.toISOString().split('T')[0] : n.createdAt.toISOString().split('T')[0]
    }));
  },

  async createNotice(title: string, content: string, target: string, isEmergency: boolean) {
    return await prisma.notice.create({
      data: {
        title,
        content,
        target,
        isEmergency,
        scheduleDate: new Date()
      }
    });
  },

  async deleteNotice(id: string) {
    return await prisma.notice.delete({ where: { id } });
  },

  // --- RESET UTILITIES ---
  async resetAnalytics() {
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.visitor.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.salary.deleteMany();
    return true;
  },

  async resetTenants() {
    await prisma.user.deleteMany({ where: { role: 'TENANT' } });
    await prisma.bed.updateMany({ data: { isAvailable: true, tenantId: null } });
    return true;
  },

  // --- HIGH-PERFORMANCE DASHBOARD METRICS ---
  async getDashboardMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      buildingsCount,
      floorsCount,
      roomsCount,
      bedsCount,
      occupiedBedsCount,
      maintenanceRoomsCount,
      activeTenantsCount,
      paidPaymentsAggregate,
      pendingInvoices,
      unpaidInvoicesCount,
      monthlyExpensesAggregate,
      employees,
      openComplaintsCount,
      openMaintenanceCount,
      openLeaveRequestsCount,
      totalTenantsCount,
      newTenantsThisMonthCount,
      notices,
      buildingsData,
      recentPaymentsList,
      recentTenantsList,
      recentComplaintsList
    ] = await Promise.all([
      prisma.building.count(),
      prisma.floor.count(),
      prisma.room.count(),
      prisma.bed.count(),
      prisma.bed.count({
        where: {
          OR: [
            { isAvailable: false },
            { tenantId: { not: null } }
          ]
        }
      }),
      prisma.room.count({ where: { status: 'MAINTENANCE' } }),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', date: { gte: startOfMonth } }
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        select: { amount: true, paidAmount: true, status: true, dueDate: true }
      }),
      prisma.invoice.count({
        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfMonth } }
      }),
      prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        include: { salaries: true }
      }),
      prisma.complaint.count({
        where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } }
      }),
      prisma.maintenance.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }
      }),
      prisma.leaveRequest.count({
        where: { status: 'PENDING' }
      }),
      prisma.tenant.count(),
      prisma.tenant.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.notice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.building.findMany({
        include: {
          floors: {
            orderBy: { number: 'asc' },
            include: {
              rooms: {
                orderBy: { number: 'asc' },
                include: {
                  beds: {
                    include: {
                      tenant: {
                        include: { profile: true }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { tenant: { include: { profile: true } } }
      }),
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { profile: true }
      }),
      prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { tenant: { include: { profile: true } } }
      })
    ]);

    const vacantBedsCount = Math.max(0, bedsCount - occupiedBedsCount);
    const monthlyIncome = paidPaymentsAggregate._sum.amount || 0;
    const monthlyExpenses = monthlyExpensesAggregate._sum.amount || 0;

    let pendingRent = 0;
    let overdueDues = 0;

    pendingInvoices.forEach(inv => {
      const balance = Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
      pendingRent += balance;
      if (inv.status === 'OVERDUE' || (inv.dueDate && new Date(inv.dueDate) < now)) {
        overdueDues += balance;
      }
    });

    const netProfit = monthlyIncome - monthlyExpenses;
    const isPaidThisMonth = (emp: any) => emp.salaries.some((s: any) => new Date(s.date) >= startOfMonth && s.status === 'PAID');
    const employeeSalaryDue = employees.reduce((sum, emp) => sum + (isPaidThisMonth(emp) ? 0 : emp.salary), 0);

    const occupiedRoomsCount = buildingsData.reduce((sum, b) => 
      sum + (b.floors?.reduce((fSum, f) => 
        fSum + (f.rooms?.filter(r => r.status === 'OCCUPIED' || r.beds?.some(bed => !bed.isAvailable || bed.tenantId)).length || 0)
      , 0) || 0)
    , 0);

    const vacantRoomsCount = Math.max(0, roomsCount - occupiedRoomsCount - maintenanceRoomsCount);
    const occupancyPercentage = bedsCount > 0 ? Math.round((occupiedBedsCount / bedsCount) * 100) : 0;

    // Build unified recent activities feed
    const recentActivities: any[] = [];
    recentTenantsList.forEach(t => {
      const name = t.profile ? `${t.profile.firstName} ${t.profile.lastName}`.trim() : 'Resident';
      recentActivities.push({
        id: `act-t-${t.id}`,
        title: 'New Resident Registered',
        desc: `${name} assigned to Room ${t.roomNumber || 'A-101'}`,
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: 'TENANT'
      });
    });

    recentPaymentsList.forEach(p => {
      const name = p.tenant?.profile ? `${p.tenant.profile.firstName} ${p.tenant.profile.lastName}`.trim() : 'Resident';
      recentActivities.push({
        id: `act-p-${p.id}`,
        title: 'Payment Received',
        desc: `₹${p.amount.toLocaleString()} received via ${p.paymentMethod || 'UPI'} from ${name}`,
        time: p.date ? new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: 'PAYMENT'
      });
    });

    recentComplaintsList.forEach(c => {
      const name = c.tenant?.profile ? `${c.tenant.profile.firstName} ${c.tenant.profile.lastName}`.trim() : 'Resident';
      recentActivities.push({
        id: `act-c-${c.id}`,
        title: 'Ticket Raised',
        desc: `${c.title} logged by ${name}`,
        time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: 'COMPLAINT'
      });
    });

    return {
      metrics: {
        totalBuildings: buildingsCount,
        buildings: buildingsCount,
        floors: floorsCount,
        totalRooms: roomsCount,
        rooms: roomsCount,
        occupiedRooms: occupiedRoomsCount,
        vacantRooms: vacantRoomsCount,
        totalBeds: bedsCount,
        beds: bedsCount,
        occupiedBeds: occupiedBedsCount,
        availableBeds: vacantBedsCount,
        vacantBeds: vacantBedsCount,
        occupancyPercentage,
        occupancyRate: occupancyPercentage,
        totalTenants: totalTenantsCount,
        activeTenants: activeTenantsCount,
        tenants: activeTenantsCount,
        newTenantsThisMonth: newTenantsThisMonthCount,
        monthlyCollection: monthlyIncome,
        monthlyIncome,
        pendingRent,
        pendingDues: pendingRent,
        overdueDues,
        unpaidInvoicesCount,
        monthlyExpenses,
        netProfit,
        employeeSalaryDue,
        pendingComplaints: openComplaintsCount,
        activeMaintenance: openMaintenanceCount + maintenanceRoomsCount,
        pendingLeaveRequests: openLeaveRequestsCount,
        maintenanceRequests: openComplaintsCount + openMaintenanceCount + maintenanceRoomsCount,
        todayCheckIns: 0,
        todayCheckOuts: 0
      },
      recentActivities: recentActivities.slice(0, 5),
      charts: {
        financials: [
          { name: now.toLocaleString('en-IN', { month: 'short' }), income: monthlyIncome, expenses: monthlyExpenses, profit: Math.max(0, netProfit) }
        ],
        occupancy: [
          { name: 'Occupied Beds', value: occupiedBedsCount },
          { name: 'Vacant Beds', value: vacantBedsCount }
        ],
        roomTypes: []
      },
      notices: notices.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        target: n.target,
        isEmergency: n.isEmergency,
        scheduleDate: n.scheduleDate ? n.scheduleDate.toISOString().split('T')[0] : n.createdAt.toISOString().split('T')[0]
      })),
      buildings: buildingsData.map(b => ({
        id: b.id,
        name: b.name,
        address: b.address,
        floors: b.floors.map(f => ({
          id: f.id,
          number: f.number,
          rooms: f.rooms.map(r => ({
            id: r.id,
            number: r.number,
            type: r.type,
            rent: r.rent,
            status: r.status,
            capacity: r.capacity,
            amenities: r.amenities ? r.amenities.split(',').map(a => a.trim()) : [],
            beds: r.beds.map(bed => ({
              id: bed.id,
              number: bed.number,
              roomId: bed.roomId,
              tenantId: bed.tenantId,
              isAvailable: bed.isAvailable,
              tenantName: bed.tenant?.profile ? `${bed.tenant.profile.firstName} ${bed.tenant.profile.lastName}`.trim() : undefined
            }))
          }))
        }))
      }))
    };
  }
};
