import { PrismaClient } from '@prisma/client';
import * as mock from './mockData';
import bcrypt from 'bcryptjs';

// Avoid multiple PrismaClient instances in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const INITIAL_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

// Runtime state for mock fallback
let mockState = {
  users: mock.mockUsers.map(u => ({
    ...u,
    password: INITIAL_PASSWORD_HASH
  })),
  buildings: [...mock.mockBuildings],
  tenants: [...mock.mockTenants],
  invoices: [...mock.mockInvoices],
  employees: [...mock.mockEmployees],
  complaints: [] as mock.MockComplaint[],
  visitors: [...mock.mockVisitors],
  inventory: [...mock.mockInventory],
  expenses: [...mock.mockExpenses],
  notices: [...mock.mockNotices],
  leaveRequests: [...mock.mockLeaveRequests]
};

// Log DB helper
function logDebug(message: string, error?: any) {
  console.log(`[Sri Sai Siri DB Service] ${message}`, error ? error.message || error : '');
}

const deletedTenantIdsSet = new Set<string>();
const deletedBuildingIdsSet = new Set<string>();

async function ensureDbSeeded() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logDebug("Database user count is 0, auto-seeding demo users into SQLite...");
      const passwordHash = bcrypt.hashSync('password123', 10);
      await prisma.user.create({
        data: {
          id: 'u-owner-1',
          email: 'owner@srisaisiri.com',
          password: passwordHash,
          role: 'OWNER',
          profile: {
            create: {
              firstName: 'Alok',
              lastName: 'Sharma',
              phone: '+91 98765 43210',
              status: 'ACTIVE'
            }
          }
        }
      });
      await prisma.user.create({
        data: {
          id: 'u-tenant-1',
          email: 'tenant@srisaisiri.com',
          password: passwordHash,
          role: 'TENANT',
          profile: {
            create: {
              firstName: 'Rohan',
              lastName: 'Verma',
              phone: '+91 98765 43210',
              status: 'ACTIVE'
            }
          }
        }
      });
      logDebug("Auto-seeded initial users into SQLite database.");
    }
  } catch (e) {
    logDebug("ensureDbSeeded warning", e);
  }
}

ensureDbSeeded();

const rawDbService = {
  // --- AUTHENTICATION ---
  async getUserByEmail(email: string) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanEmail } },
            { email: { equals: email } }
          ]
        },
        include: { profile: true }
      });
      if (user) return user;
    } catch (e) {
      logDebug("getUserByEmail failed, using mock", e);
    }

    const mUser = mockState.users.find(u => {
      const uEmail = u.email.toLowerCase();
      return uEmail === cleanEmail || 
             uEmail.replace('@hostelflow.com', '@srisaisiri.com') === cleanEmail ||
             uEmail.replace('@srisaisiri.com', '@hostelflow.com') === cleanEmail;
    });

    if (!mUser) return null;

    return {
      id: mUser.id,
      email: mUser.email,
      password: (mUser as any).password,
      role: mUser.role,
      name: mUser.name,
      profile: mUser.role === 'TENANT' ? mockState.tenants.find(t => t.userId === mUser.id) : null
    };
  },

  async updateUserPassword(email: string, hashedPassword: string) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    try {
      // Find all user records matching email or alias
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { equals: cleanEmail } },
            { email: { equals: email } }
          ]
        }
      });
      for (const u of users) {
        await prisma.user.update({
          where: { id: u.id },
          data: { password: hashedPassword }
        });
      }
    } catch (e) {
      logDebug("updateUserPassword Prisma failed, updating mock", e);
    }

    mockState.users.forEach(mUser => {
      const uEmail = mUser.email.toLowerCase();
      if (
        uEmail === cleanEmail ||
        uEmail.replace('@hostelflow.com', '@srisaisiri.com') === cleanEmail ||
        uEmail.replace('@srisaisiri.com', '@hostelflow.com') === cleanEmail
      ) {
        (mUser as any).password = hashedPassword;
      }
    });
    return true;
  },

  async registerUser(userData: { id: string; email: string; password: string; role: 'OWNER' | 'TENANT'; name: string }) {
    if (!userData || !userData.email) return null;
    const cleanEmail = userData.email.trim().toLowerCase();
    
    const existingIndex = mockState.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      mockState.users[existingIndex] = {
        ...mockState.users[existingIndex],
        ...userData,
        password: userData.password
      };
    } else {
      mockState.users.push({
        id: userData.id || `u-owner-${Date.now()}`,
        email: cleanEmail,
        password: userData.password,
        role: userData.role || 'OWNER',
        name: userData.name || 'Owner'
      });
    }

    try {
      await prisma.user.upsert({
        where: { email: cleanEmail },
        update: { password: userData.password },
        create: {
          id: userData.id || `u-owner-${Date.now()}`,
          email: cleanEmail,
          password: userData.password,
          role: userData.role || 'OWNER',
          profile: {
            create: {
              firstName: userData.name.split(' ')[0] || userData.name,
              lastName: userData.name.split(' ').slice(1).join(' ') || '',
              phone: '+91 98765 43210',
              status: 'ACTIVE'
            }
          }
        }
      });
    } catch (e) {
      logDebug("registerUser Prisma upsert fallback", e);
    }

    return {
      id: userData.id || `u-owner-${Date.now()}`,
      email: cleanEmail,
      password: userData.password,
      role: userData.role || 'OWNER',
      name: userData.name || 'Owner',
      profile: null
    };
  },

  // --- BUILDINGS & ROOMS ---
  async getBuildings() {
    try {
      const buildings = await prisma.building.findMany({
        include: {
          floors: {
            include: {
              rooms: {
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
        }
      });

      const result = buildings.map(b => ({
        ...b,
        floors: b.floors.map(f => ({
          ...f,
          rooms: f.rooms.map(r => ({
            ...r,
            beds: r.beds.map(bed => {
              let tenantName = undefined;
              if (bed.tenant?.profile) {
                tenantName = `${bed.tenant.profile.firstName} ${bed.tenant.profile.lastName}`.trim();
              }
              return {
                id: bed.id,
                number: bed.number,
                roomId: bed.roomId,
                tenantId: bed.tenantId,
                isAvailable: bed.isAvailable,
                tenantName: tenantName
              };
            })
          }))
        }))
      }));
      return result.filter((b: any) => !deletedBuildingIdsSet.has(b.id));
    } catch (e) {
      logDebug("getBuildings failed, using mock", e);
      return mockState.buildings.filter(b => !deletedBuildingIdsSet.has(b.id));
    }
  },

  async createBuilding(name: string, address: string, floorsCount: number) {
    try {
      return await prisma.building.create({
        data: {
          name,
          address,
          floors: {
            create: Array.from({ length: floorsCount }).map((_, i) => ({
              number: i + 1
            }))
          }
        }
      });
    } catch (e) {
      logDebug("createBuilding failed, using mock", e);
      const newBuilding: mock.MockBuilding = {
        id: `b-${Date.now()}`,
        name,
        address,
        floors: Array.from({ length: floorsCount }).map((_, i) => ({
          id: `f-${Date.now()}-${i}`,
          number: i + 1,
          rooms: []
        }))
      };
      mockState.buildings.push(newBuilding);
    }
  },

  async deleteBuilding(buildingId: string) {
    deletedBuildingIdsSet.add(buildingId);
    mockState.buildings = mockState.buildings.filter(x => x.id !== buildingId);
    try {
      await prisma.building.delete({
        where: { id: buildingId }
      });
    } catch (e) {
      logDebug("deleteBuilding Prisma failed", e);
    }
  },

  async createRoom(floorId: string, number: string, type: string, rent: number, capacity: number, amenities: string) {
    try {
      return await prisma.room.create({
        data: {
          number,
          type,
          rent,
          capacity,
          amenities,
          floorId,
          beds: {
            create: Array.from({ length: capacity }).map((_, i) => ({
              number: `${number}-${String.fromCharCode(65 + i)}`,
              isAvailable: true
            }))
          }
        }
      });
    } catch (e) {
      logDebug("createRoom failed, using mock", e);
      const bIndex = mockState.buildings.findIndex(b => b.floors.some(f => f.id === floorId));
      if (bIndex !== -1) {
        const fIndex = mockState.buildings[bIndex].floors.findIndex(f => f.id === floorId);
        const newRoom = {
          id: `r-${Date.now()}`,
          number,
          type,
          rent,
          capacity,
          status: 'AVAILABLE' as const,
          amenities: amenities.split(',').map(a => a.trim()),
          beds: Array.from({ length: capacity }).map((_, i) => ({
            id: `bed-${Date.now()}-${i}`,
            number: `${number}-${String.fromCharCode(65 + i)}`,
            tenantId: null,
            isAvailable: true
          }))
        };
        mockState.buildings[bIndex].floors[fIndex].rooms.push(newRoom);
        return newRoom;
      }
      return null;
    }
  },

  async deleteRoom(roomId: string) {
    try {
      await prisma.room.delete({
        where: { id: roomId }
      });
    } catch (e) {
      logDebug("deleteRoom failed, using mock", e);
      mockState.buildings.forEach(b => {
        b.floors.forEach(f => {
          f.rooms = f.rooms.filter((r: any) => r.id !== roomId);
        });
      });
    }
  },

  async updateRoom(roomId: string, data: { number?: string; type?: string; rent?: number; capacity?: number; status?: string }) {
    try {
      await prisma.room.update({
        where: { id: roomId },
        data: {
          number: data.number,
          type: data.type,
          rent: data.rent,
          capacity: data.capacity,
          status: data.status
        }
      });
    } catch (e) {
      logDebug("updateRoom failed, updating mock", e);
      mockState.buildings.forEach(b => {
        b.floors.forEach(f => {
          f.rooms.forEach((r: any) => {
            if (r.id === roomId) {
              if (data.number) r.number = data.number;
              if (data.type) r.type = data.type;
              if (data.rent !== undefined) r.rent = data.rent;
              if (data.capacity !== undefined) r.capacity = data.capacity;
              if (data.status) r.status = data.status;
            }
          });
        });
      });
    }
    return true;
  },

  async updateBuilding(buildingId: string, data: { name?: string; address?: string }) {
    try {
      await prisma.building.update({
        where: { id: buildingId },
        data
      });
    } catch (e) {
      logDebug("updateBuilding failed, updating mock", e);
      const b = mockState.buildings.find(b => b.id === buildingId);
      if (b) {
        if (data.name) b.name = data.name;
        if (data.address) b.address = data.address;
      }
    }
    return true;
  },

  // --- TENANTS ---
  async getTenants() {
    try {
      const dbTenants = await prisma.tenant.findMany({
        include: { profile: { include: { user: true } } }
      });
      const tenantsList = dbTenants.map(t => ({
        id: t.id,
        userId: t.profile.userId,
        name: `${t.profile.firstName} ${t.profile.lastName}`.trim(),
        email: t.profile.user.email,
        phone: t.profile.phone,
        gender: t.profile.gender || 'Male',
        address: t.profile.address || '',
        aadhaar: t.profile.aadhaar || '',
        emergencyName: t.profile.emergencyContactName || '',
        emergencyPhone: t.profile.emergencyContactPhone || '',
        guardianName: t.profile.guardianName || '',
        guardianPhone: t.profile.guardianPhone || '',
        occupation: t.profile.occupation || 'Student',
        moveInDate: t.profile.moveInDate ? new Date(t.profile.moveInDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        moveOutDate: t.profile.moveOutDate ? new Date(t.profile.moveOutDate).toISOString().split('T')[0] : null,
        status: t.status as 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED',
        roomNumber: t.roomNumber || '',
        bedNumber: t.bedNumber || '',
        rentAmount: t.rentAmount,
        agreementUrl: t.agreementUrl || '/docs/default_agreement.pdf',
        medicalNotes: t.medicalNotes || '',
        photoUrl: t.profile.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop'
      }));
      return tenantsList.filter((t: any) => !deletedTenantIdsSet.has(t.id));
    } catch (e) {
      logDebug("getTenants failed, using mock", e);
      return mockState.tenants.filter(t => !deletedTenantIdsSet.has(t.id));
    }
  },

  async createTenant(data: Omit<mock.MockTenant, 'id' | 'userId'> & { password?: string }) {
    const { password, ...tenantData } = data;
    const tenantId = `t-${Date.now()}`;
    const userId = `u-tenant-${Date.now()}`;

    // Update local mock store
    const newTenant: mock.MockTenant = {
      id: tenantId,
      userId,
      ...tenantData
    };
    mockState.tenants.push(newTenant);

    const newUser: mock.MockUser = {
      id: userId,
      email: tenantData.email,
      role: 'TENANT',
      name: tenantData.name
    };
    mockState.users.push({ ...newUser, password: INITIAL_PASSWORD_HASH });

    // Book bed in mock data
    mockState.buildings.forEach(b => {
      b.floors.forEach(f => {
        f.rooms.forEach(r => {
          r.beds.forEach(bed => {
            if (bed.number === tenantData.bedNumber) {
              bed.tenantId = tenantId;
              bed.tenantName = tenantData.name;
              bed.isAvailable = false;
              r.status = 'OCCUPIED';
            }
          });
        });
      });
    });

    let passwordHash = "$2a$10$3zR14Q8tVvGq.3wKjJ3eDeZc2UuW5R4lQpUaO.u5Xl.u5Xl.u5Xl."; // password123 default
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    try {
      // Attempt prisma write
      const createdUser = await prisma.user.create({
        data: {
          id: userId,
          email: tenantData.email,
          password: passwordHash,          role: "TENANT",
          profile: {
            create: {
              firstName: tenantData.name.split(' ')[0] || 'Tenant',
              lastName: tenantData.name.split(' ').slice(1).join(' ') || '',
              phone: tenantData.phone,
              gender: tenantData.gender,
              address: tenantData.address,
              aadhaar: tenantData.aadhaar,
              emergencyContactName: tenantData.emergencyName,
              emergencyContactPhone: tenantData.emergencyPhone,
              guardianName: tenantData.guardianName,
              guardianPhone: tenantData.guardianPhone,
              occupation: tenantData.occupation || 'Student',
              moveInDate: new Date(tenantData.moveInDate),
              status: "ACTIVE",
              tenant: {
                create: {
                  id: tenantId,
                  roomNumber: tenantData.roomNumber,
                  bedNumber: tenantData.bedNumber,
                  rentAmount: tenantData.rentAmount,
                  agreementUrl: tenantData.agreementUrl,
                  medicalNotes: tenantData.medicalNotes,
                  status: "ACTIVE",
                  moveInDate: new Date(tenantData.moveInDate)
                }
              }
            }
          }
        }
      });

      // Also update bed occupancy in database
      if (tenantData.bedNumber) {
        const beds = await prisma.bed.findMany();
        const targetBed = beds.find(b => 
          b.number.replace(/\s+/g, '') === tenantData.bedNumber.replace(/\s+/g, '')
        );
        if (targetBed) {
          await prisma.bed.update({
            where: { id: targetBed.id },
            data: {
              tenantId: tenantId,
              isAvailable: false
            }
          });
        }
      }

      logDebug("Successfully wrote tenant to db", createdUser);
    } catch (e) {
      logDebug("createTenant Prisma insert bypassed (using mock fallback)", e);
    }

    return newTenant;
  },

  async updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED') {
    const t = mockState.tenants.find(x => x.id === tenantId);
    if (t) {
      t.status = status;
      if (status !== 'ACTIVE') {
        // Free bed
        mockState.buildings.forEach(b => {
          b.floors.forEach(f => {
            f.rooms.forEach(r => {
              r.beds.forEach(bed => {
                if (bed.number === t.bedNumber) {
                  bed.tenantId = null;
                  bed.tenantName = undefined;
                  bed.isAvailable = true;
                }
              });
              // check occupancy status
              const hasOccupants = r.beds.some(b => !b.isAvailable);
              r.status = hasOccupants ? 'OCCUPIED' : 'AVAILABLE';
            });
          });
        });
      }
    }
    if (status !== 'ACTIVE') {
      try {
        const dbTenant = await prisma.tenant.findUnique({
          where: { id: tenantId }
        });
        if (dbTenant) {
          await prisma.bed.updateMany({
            where: { tenantId: tenantId },
            data: {
              tenantId: null,
              isAvailable: true
            }
          });
        }
      } catch (e) {
        logDebug("updateTenantStatus DB bed free failed", e);
      }
    }
    try {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status }
      });
    } catch (e) {
      logDebug("updateTenantStatus bypassed", e);
    }
  },
  async updateTenantProfile(tenantId: string, data: { name: string, email: string, phone: string, gender: string, moveInDate: string, password?: string, roomNumber?: string, bedNumber?: string, rentAmount?: number }) {
    const t = mockState.tenants.find(x => x.id === tenantId);
    let hashedPassword = '';
    if (data.password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const oldBedNumber = t?.bedNumber;

    if (t) {
      t.name = data.name;
      t.email = data.email;
      t.phone = data.phone;
      t.gender = data.gender;
      t.moveInDate = data.moveInDate;

      if (data.roomNumber !== undefined) t.roomNumber = data.roomNumber;
      if (data.bedNumber !== undefined) t.bedNumber = data.bedNumber;
      if (data.rentAmount !== undefined) t.rentAmount = data.rentAmount;

      // also update user
      const u = mockState.users.find(x => x.id === t.userId);
      if (u) {
        u.name = data.name;
        u.email = data.email;
        if (hashedPassword) {
          (u as any).password = hashedPassword;
        }
      }

      // Update mock beds occupancy
      if (data.bedNumber && data.bedNumber !== oldBedNumber) {
        mockState.buildings.forEach(b => {
          b.floors.forEach(f => {
            f.rooms.forEach(r => {
              r.beds.forEach(bed => {
                // Free old bed
                if (bed.number === oldBedNumber) {
                  bed.tenantId = null;
                  bed.tenantName = undefined;
                  bed.isAvailable = true;
                }
                // Book new bed
                if (bed.number === data.bedNumber) {
                  bed.tenantId = tenantId;
                  bed.tenantName = data.name;
                  bed.isAvailable = false;
                }
              });
              // Recalculate room status
              const hasOccupants = r.beds.some(b => !b.isAvailable);
              r.status = hasOccupants ? 'OCCUPIED' : 'AVAILABLE';
            });
          });
        });
      }
    }

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { profile: true }
      });
      if (tenant) {
        const parts = data.name.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        await prisma.profile.update({
          where: { id: tenant.profileId },
          data: {
            firstName,
            lastName,
            phone: data.phone,
            gender: data.gender,
            moveInDate: new Date(data.moveInDate)
          }
        });

        const userUpdateData: any = { email: data.email };
        if (hashedPassword) {
          userUpdateData.password = hashedPassword;
        }

        await prisma.user.update({
          where: { id: tenant.profile.userId },
          data: userUpdateData
        });

        // Update Tenant Table room and bed info
        const tenantUpdateData: any = {};
        if (data.roomNumber !== undefined) tenantUpdateData.roomNumber = data.roomNumber;
        if (data.bedNumber !== undefined) tenantUpdateData.bedNumber = data.bedNumber;
        if (data.rentAmount !== undefined) tenantUpdateData.rentAmount = data.rentAmount;

        if (Object.keys(tenantUpdateData).length > 0) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: tenantUpdateData
          });
        }

        // Update database beds occupancy
        if (data.bedNumber && data.bedNumber !== oldBedNumber) {
          const targetBedNumber = data.bedNumber;
          // Free any beds currently occupied by this tenant
          await prisma.bed.updateMany({
            where: { tenantId: tenantId },
            data: { tenantId: null, isAvailable: true }
          });
          
          // Book new bed in DB (matching space-insensitively)
          const beds = await prisma.bed.findMany();
          const targetBed = beds.find(b => 
            b.number.replace(/\s+/g, '') === targetBedNumber.replace(/\s+/g, '')
          );
          if (targetBed) {
            await prisma.bed.update({
              where: { id: targetBed.id },
              data: { tenantId: tenantId, isAvailable: false }
            });
          }
        }
      }
    } catch (e) {
      logDebug("updateTenantProfile Prisma bypassed", e);
    }
  },

  // --- RENT & INVOICES ---
  async getInvoices() {
    try {
      const dbInvoices = await prisma.invoice.findMany({
        include: { tenant: { include: { profile: true } } }
      });
      return dbInvoices.map(inv => {
        let items: any[] = [];
        let remarks: string = '';
        try {
          const parsed = JSON.parse(inv.itemsJson);
          if (Array.isArray(parsed)) {
            items = parsed;
          } else {
            items = parsed.items || [];
            remarks = parsed.remarks || '';
          }
        } catch (e) {
          items = [];
        }
        return {
          id: inv.id,
          number: inv.number,
          tenantId: inv.tenantId,
          tenantName: `${inv.tenant.profile.firstName} ${inv.tenant.profile.lastName}`.trim(),
          roomNumber: inv.tenant.roomNumber || 'N/A',
          amount: inv.amount,
          paidAmount: inv.paidAmount,
          dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
          status: inv.status as any,
          items,
          remarks,
          dateCreated: new Date(inv.createdAt).toISOString().split('T')[0]
        };
      });
    } catch (e) {
      logDebug("getInvoices failed, using mock", e);
      return mockState.invoices;
    }
  },

  async createInvoice(tenantId: string, amount: number, items: { description: string; amount: number }[], dueDate: string) {
    let resolvedTenantId = tenantId;
    let resolvedTenantName = 'Unknown Tenant';
    let resolvedRoomNumber = 'N/A';

    const tenant = mockState.tenants.find(t => t.id === tenantId || t.userId === tenantId);
    if (tenant) {
      resolvedTenantId = tenant.id;
      resolvedTenantName = tenant.name;
      resolvedRoomNumber = tenant.roomNumber;
    }

    try {
      const dbTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: tenantId },
            { profile: { userId: tenantId } }
          ]
        },
        include: { profile: true }
      });
      if (dbTenant) {
        resolvedTenantId = dbTenant.id;
        resolvedTenantName = `${dbTenant.profile.firstName} ${dbTenant.profile.lastName}`.trim();
        resolvedRoomNumber = dbTenant.roomNumber || 'N/A';
      }
    } catch (e) {
      logDebug("createInvoice database lookup failed", e);
    }

    const newInvoice: mock.MockInvoice = {
      id: `inv-${Date.now()}`,
      number: `INV-2026-${String(Date.now()).slice(-4)}`,
      tenantId: resolvedTenantId,
      tenantName: resolvedTenantName,
      roomNumber: resolvedRoomNumber,
      amount,
      paidAmount: 0,
      dueDate,
      status: 'PENDING',
      items,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    mockState.invoices.unshift(newInvoice);

    try {
      await prisma.invoice.create({
        data: {
          id: newInvoice.id,
          number: newInvoice.number,
          tenantId: resolvedTenantId,
          amount,
          paidAmount: 0,
          dueDate: new Date(dueDate),
          status: 'PENDING',
          itemsJson: JSON.stringify(items)
        }
      });
    } catch (e) {
      logDebug("createInvoice Prisma bypassed", e);
    }
    return newInvoice;
  },

  async recordPayment(invoiceId: string, amount: number, method: string, isTenantPayment: boolean = false) {
    const inv = mockState.invoices.find(i => i.id === invoiceId);
    if (inv) {
      if (isTenantPayment) {
        inv.status = 'PENDING_VERIFICATION';
        (inv as any).tempPaidAmount = amount;
      } else {
        inv.paidAmount += amount;
        if (inv.paidAmount >= inv.amount) {
          inv.status = 'PAID';
        } else {
          inv.status = 'PARTIAL';
        }

        // Add payment
        mockState.expenses.push({
          id: `pay-${Date.now()}`,
          title: `Rent collection - ${inv.tenantName} (${inv.number})`,
          amount: -amount, // negative expense = income
          category: 'SALARY', // category map
          date: new Date().toISOString().split('T')[0],
          notes: `Rent received via ${method}`
        });
      }
    }

    try {
      if (isTenantPayment) {
        const dbInv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (dbInv) {
          const updated = await prisma.invoice.update({
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
          return updated;
        }
      } else {
        const dbInv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (dbInv) {
          const newPaid = dbInv.paidAmount + amount;
          const status = newPaid >= dbInv.amount ? 'PAID' : 'PARTIAL';
          const updated = await prisma.invoice.update({
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
          return updated;
        }
      }
    } catch (e) {
      logDebug("recordPayment failed", e);
    }
    return inv;
  },

  async verifyInvoicePayment(invoiceId: string, remarks: string = 'Verified online payment') {
    const inv = mockState.invoices.find(i => i.id === invoiceId);
    if (inv) {
      const verifyAmount = (inv as any).tempPaidAmount !== undefined ? (inv as any).tempPaidAmount : (inv.amount - inv.paidAmount);
      inv.paidAmount += verifyAmount;
      inv.status = inv.paidAmount >= inv.amount ? 'PAID' : 'PARTIAL';
      (inv as any).remarks = remarks;
      delete (inv as any).tempPaidAmount;

      // Add payment
      mockState.expenses.push({
        id: `pay-${Date.now()}`,
        title: `Rent collection verified - ${inv.tenantName} (${inv.number})`,
        amount: -verifyAmount, // negative expense = income
        category: 'SALARY', // category map
        date: new Date().toISOString().split('T')[0],
        notes: remarks
      });
    }

    try {
      const dbInv = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      });
      if (dbInv) {
        const pendingPayment = dbInv.payments.find(p => p.status === 'PENDING');
        const verifyAmount = pendingPayment ? pendingPayment.amount : (dbInv.amount - dbInv.paidAmount);

        if (pendingPayment) {
          await prisma.payment.update({
            where: { id: pendingPayment.id },
            data: { status: 'PAID' }
          });
        } else {
          await prisma.payment.create({
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

        // Parse existing itemsJson to append remarks
        let items = [];
        try {
          const parsed = JSON.parse(dbInv.itemsJson);
          items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        } catch (e) {
          items = [];
        }

        const newItemsJson = JSON.stringify({ items, remarks });

        const updated = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            itemsJson: newItemsJson
          }
        });
        return updated;
      }
    } catch (e) {
      logDebug("verifyInvoicePayment failed", e);
    }
    return inv;
  },

  async revertInvoicePayment(invoiceId: string, remarks: string) {
    const inv = mockState.invoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.status = 'PENDING_VERIFICATION';
      inv.paidAmount = 0;
      (inv as any).remarks = remarks;

      // also remove from expenses if it was recorded
      mockState.expenses = mockState.expenses.filter(exp => !exp.title.includes(inv.number));
    }

    try {
      const dbInv = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      });

      if (dbInv) {
        // Delete all payments associated with this invoice
        await prisma.payment.deleteMany({
          where: { invoiceId }
        });

        // Recreate a pending verification payment proof record
        await prisma.payment.create({
          data: {
            amount: dbInv.amount,
            type: 'RENT',
            paymentMethod: 'ONLINE',
            status: 'PENDING',
            tenantId: dbInv.tenantId,
            invoiceId: dbInv.id
          }
        });

        // Parse existing itemsJson to append remarks
        let items = [];
        try {
          const parsed = JSON.parse(dbInv.itemsJson);
          items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        } catch (e) {
          items = [];
        }

        const newItemsJson = JSON.stringify({ items, remarks });

        // Update invoice in database back to PENDING_VERIFICATION
        const updated = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: 0,
            status: 'PENDING_VERIFICATION',
            itemsJson: newItemsJson
          }
        });
        return updated;
      }
    } catch (e) {
      logDebug("revertInvoicePayment failed", e);
    }
    return inv;
  },

  // --- EMPLOYEES & SALARY ---
  async getEmployees() {
    try {
      const dbEmployees = await prisma.employee.findMany({
        include: { salaries: true }
      });
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      return dbEmployees.map(emp => {
        const isPaidThisMonth = emp.salaries.some(sal => new Date(sal.date) >= startOfMonth && sal.status === 'PAID');
        return {
          ...emp,
          isPaidThisMonth
        };
      });
    } catch (e) {
      logDebug("getEmployees failed, using mock", e);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      return mockState.employees.map(emp => {
        const hasSalaryExpense = mockState.expenses.some(exp => 
          exp.category === 'SALARY' && 
          exp.title.includes(emp.name) && 
          new Date(exp.date) >= startOfMonth
        );
        return {
          ...emp,
          isPaidThisMonth: hasSalaryExpense
        };
      });
    }
  },

  async createEmployee(employeeData: Omit<mock.MockEmployee, 'id' | 'pendingSalary' | 'advanceTaken'>) {
    const newEmp: mock.MockEmployee = {
      id: `emp-${Date.now()}`,
      pendingSalary: 0,
      advanceTaken: 0,
      ...employeeData
    };
    mockState.employees.push(newEmp);

    try {
      await prisma.employee.create({
        data: {
          name: employeeData.name,
          phone: employeeData.phone,
          address: employeeData.address,
          role: employeeData.role,
          salary: employeeData.salary,
          status: 'ACTIVE',
          bankDetails: employeeData.bankDetails,
          emergencyContact: employeeData.emergencyContact,
          photoUrl: employeeData.photoUrl,
          joiningDate: new Date(employeeData.joiningDate)
        }
      });
    } catch (e) {
      logDebug("createEmployee Prisma bypassed", e);
    }
    return newEmp;
  },

  async paySalary(employeeId: string, amount: number, bonus: number, deductions: number, advancePaid: number) {
    const emp = mockState.employees.find(e => e.id === employeeId);
    if (emp) {
      emp.pendingSalary = Math.max(0, emp.pendingSalary - amount);
      emp.advanceTaken += advancePaid;
      
      // record expense
      mockState.expenses.push({
        id: `exp-${Date.now()}`,
        title: `Salary paid to ${emp.name}`,
        amount: amount + bonus - deductions,
        category: 'SALARY',
        date: new Date().toISOString().split('T')[0],
        notes: `Bonus: ${bonus}, Deductions: ${deductions}, Advance adjustment: ${advancePaid}`
      });
    }

    try {
      await prisma.salary.create({
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
    } catch (e) {
      logDebug("paySalary Prisma bypassed", e);
    }
  },

  async updateEmployee(id: string, data: any) {
    const emp = mockState.employees.find(e => e.id === id);
    if (emp) {
      if (data.name) emp.name = data.name;
      if (data.phone) emp.phone = data.phone;
      if (data.role) emp.role = data.role;
      if (data.salary !== undefined) emp.salary = parseFloat(data.salary);
      if (data.status) emp.status = data.status;
      if (data.bankDetails) emp.bankDetails = data.bankDetails;
    }
    try {
      await prisma.employee.update({
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
    } catch (e) {
      logDebug("updateEmployee Prisma failed", e);
    }
    return true;
  },

  // --- COMPLAINTS ---
  async getComplaints() {
    try {
      const dbComplaints = await prisma.complaint.findMany({
        include: { tenant: { include: { profile: true } }, assignedEmployee: true }
      });
      return dbComplaints.map(comp => ({
        id: comp.id,
        title: comp.title,
        description: comp.description,
        category: comp.category as any,
        status: comp.status as any,
        tenantId: comp.tenantId,
        tenantName: `${comp.tenant.profile.firstName} ${comp.tenant.profile.lastName}`.trim(),
        roomNumber: comp.tenant.roomNumber || 'N/A',
        assignedEmployeeId: comp.assignedEmployeeId,
        assignedEmployeeName: comp.assignedEmployee ? comp.assignedEmployee.name : undefined,
        dateCreated: new Date(comp.createdAt).toISOString().split('T')[0]
      }));
    } catch (e) {
      logDebug("getComplaints failed, using mock", e);
      return mockState.complaints;
    }
  },

  async createComplaint(tenantId: string, title: string, description: string, category: string) {
    let resolvedTenantId = tenantId;
    let resolvedTenantName = 'Unknown Tenant';
    let resolvedRoomNumber = 'N/A';

    const tenant = mockState.tenants.find(t => t.id === tenantId || t.userId === tenantId);
    if (tenant) {
      resolvedTenantId = tenant.id;
      resolvedTenantName = tenant.name;
      resolvedRoomNumber = tenant.roomNumber;
    }

    try {
      const dbTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: tenantId },
            { profile: { userId: tenantId } }
          ]
        },
        include: { profile: true }
      });
      if (dbTenant) {
        resolvedTenantId = dbTenant.id;
        resolvedTenantName = `${dbTenant.profile.firstName} ${dbTenant.profile.lastName}`.trim();
        resolvedRoomNumber = dbTenant.roomNumber || 'N/A';
      }
    } catch (e) {
      logDebug("createComplaint database lookup failed", e);
    }

    const newComp: mock.MockComplaint = {
      id: `comp-${Date.now()}`,
      title,
      description,
      category: category as any,
      status: 'PENDING',
      tenantId: resolvedTenantId,
      tenantName: resolvedTenantName,
      roomNumber: resolvedRoomNumber,
      assignedEmployeeId: null,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    mockState.complaints.unshift(newComp);

    try {
      await prisma.complaint.create({
        data: {
          id: newComp.id,
          title,
          description,
          category,
          tenantId: resolvedTenantId,
          status: 'PENDING'
        }
      });
    } catch (e) {
      logDebug("createComplaint Prisma bypassed", e);
    }
    return newComp;
  },

  async updateComplaintStatus(complaintId: string, status: string, employeeId?: string) {
    const comp = mockState.complaints.find(c => c.id === complaintId);
    let assignedEmployeeName: string | undefined = undefined;
    
    if (comp) {
      comp.status = status as any;
      if (employeeId) {
        comp.assignedEmployeeId = employeeId;
        const emp = mockState.employees.find(e => e.id === employeeId);
        comp.assignedEmployeeName = emp ? emp.name : undefined;
        assignedEmployeeName = comp.assignedEmployeeName;
      }
    }

    try {
      if (employeeId && !assignedEmployeeName) {
        const emp = await prisma.employee.findUnique({
          where: { id: employeeId }
        });
        if (emp) assignedEmployeeName = emp.name;
      }

      await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status,
          assignedEmployeeId: employeeId || undefined
        }
      });
    } catch (e) {
      logDebug("updateComplaintStatus Prisma bypassed", e);
    }

    return comp ? {
      ...comp,
      status,
      assignedEmployeeId: employeeId || null,
      assignedEmployeeName
    } : null;
  },

  async deleteComplaint(complaintId: string) {
    mockState.complaints = mockState.complaints.filter(c => c.id !== complaintId);
    try {
      await prisma.complaint.delete({
        where: { id: complaintId }
      });
    } catch (e) {
      logDebug("deleteComplaint Prisma failed", e);
    }
    return true;
  },

  // --- LEAVE REQUESTS ---
  async getLeaveRequests() {
    return mockState.leaveRequests;
  },

  async createLeaveRequest(tenantId: string, startDate: string, endDate: string, reason: string) {
    const tenant = mockState.tenants.find(t => t.id === tenantId || t.userId === tenantId);
    const newLeave: mock.MockLeaveRequest = {
      id: `l-${Date.now()}`,
      tenantId: tenant ? tenant.id : tenantId,
      tenantName: tenant ? tenant.name : 'Unknown Tenant',
      roomNumber: tenant ? tenant.roomNumber : 'N/A',
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      dateCreated: new Date().toISOString().split('T')[0]
    };
    mockState.leaveRequests.unshift(newLeave);
    return newLeave;
  },

  async approveLeaveRequest(leaveId: string, status: 'APPROVED' | 'REJECTED') {
    const l = mockState.leaveRequests.find(x => x.id === leaveId);
    if (l) l.status = status;
    return l;
  },

  // --- VISITOR LOGS ---
  async getVisitors() {
    return mockState.visitors;
  },

  async createVisitorRequest(tenantId: string, name: string, phone: string, personVisiting: string, checkIn: string) {
    const newVisitor: mock.MockVisitor = {
      id: `vis-${Date.now()}`,
      name,
      phone,
      personVisiting,
      checkIn,
      checkOut: null,
      approvalStatus: 'PENDING',
      tenantId
    };
    mockState.visitors.unshift(newVisitor);
    return newVisitor;
  },

  async updateVisitorStatus(visitorId: string, status: 'APPROVED' | 'REJECTED' | 'CHECKOUT') {
    const v = mockState.visitors.find(x => x.id === visitorId);
    if (v) {
      if (status === 'CHECKOUT') {
        v.checkOut = new Date().toISOString().replace('T', ' ').slice(0, 16);
      } else {
        v.approvalStatus = status;
      }
    }
    return v;
  },

  // --- EXPENSES ---
  async getExpenses() {
    return mockState.expenses;
  },

  async createExpense(title: string, amount: number, category: string, date: string, notes: string) {
    const newExpense: mock.MockExpense = {
      id: `exp-${Date.now()}`,
      title,
      amount,
      category: category as any,
      date,
      notes
    };
    mockState.expenses.unshift(newExpense);
    return newExpense;
  },

  // --- INVENTORY ---
  async getInventory() {
    return mockState.inventory;
  },

  async createInventoryItem(name: string, category: string, quantity: number, condition: string, purchaseDate: string, cost: number, warrantyYears: number, vendor: string) {
    const newItem: mock.MockInventory = {
      id: `inv-item-${Date.now()}`,
      name,
      category,
      quantity,
      condition,
      purchaseDate,
      cost,
      warrantyYears,
      vendor,
      replacementDate: null
    };
    mockState.inventory.unshift(newItem);
    return newItem;
  },

  async updateInventoryItem(itemId: string, quantity: number, condition: string) {
    const item = mockState.inventory.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.condition = condition;
    }
    return item;
  },

  // --- NOTICES ---
  async getNotices() {
    return mockState.notices;
  },

  async createNotice(title: string, content: string, target: string, isEmergency: boolean) {
    const newNotice: mock.MockNotice = {
      id: `n-${Date.now()}`,
      title,
      content,
      target: target as any,
      isEmergency,
      scheduleDate: new Date().toISOString().split('T')[0]
    };
    mockState.notices.unshift(newNotice);
    return newNotice;
  },

  async deleteNotice(id: string) {
    mockState.notices = mockState.notices.filter(n => n.id !== id);
    try {
      await prisma.notice.delete({ where: { id } });
    } catch (e) {
      logDebug("deleteNotice failed", e);
    }
  },

  async deleteExpense(id: string) {
    mockState.expenses = mockState.expenses.filter(e => e.id !== id);
    try {
      await prisma.expense.delete({ where: { id } });
    } catch (e) {
      logDebug("deleteExpense failed", e);
    }
  },

  async deleteInventory(id: string) {
    mockState.inventory = mockState.inventory.filter(i => i.id !== id);
    try {
      await prisma.inventory.delete({ where: { id } });
    } catch (e) {
      logDebug("deleteInventory failed", e);
    }
  },

  async deleteEmployee(id: string) {
    mockState.employees = mockState.employees.filter(e => e.id !== id);
    try {
      await prisma.employee.delete({ where: { id } });
    } catch (e) {
      logDebug("deleteEmployee failed", e);
    }
  },

  async deleteTenant(id: string) {
    deletedTenantIdsSet.add(id);
    const tenant = mockState.tenants.find(t => t.id === id);
    if (tenant) {
      mockState.tenants = mockState.tenants.filter(t => t.id !== id);
      // Mark bed as available
      mockState.buildings.forEach(b => {
        b.floors.forEach(f => {
          f.rooms.forEach(r => {
            r.beds.forEach(bed => {
              if (bed.tenantId === id) {
                bed.isAvailable = true;
                bed.tenantId = null;
              }
            });
          });
        });
      });
    }

    try {
      const dbTenant = await prisma.tenant.findUnique({
        where: { id },
        include: { profile: true }
      });
      if (dbTenant) {
        // Cascade delete User -> Profile -> Tenant
        await prisma.user.delete({
          where: { id: dbTenant.profile.userId }
        });
        await prisma.bed.updateMany({
          where: { tenantId: id },
          data: { isAvailable: true, tenantId: null }
        });
      }
    } catch (e) {
      logDebug("deleteTenant failed", e);
    }
  },

  async deleteInvoice(invoiceId: string) {
    mockState.invoices = mockState.invoices.filter(i => i.id !== invoiceId);
    try {
      await prisma.payment.deleteMany({
        where: { invoiceId }
      });
      const deleted = await prisma.invoice.delete({
        where: { id: invoiceId }
      });
      return deleted;
    } catch (e) {
      logDebug("deleteInvoice failed", e);
    }
    return null;
  },

  async updateInvoice(invoiceId: string, data: { amount?: number; dueDate?: string; month?: string; status?: string }) {
    const inv = mockState.invoices.find(i => i.id === invoiceId);
    if (inv) {
      if (data.amount !== undefined) inv.amount = data.amount;
      if (data.dueDate !== undefined) inv.dueDate = data.dueDate;
      if (data.status) {
        inv.status = data.status as any;
        if (data.status === 'PAID') {
          inv.paidAmount = inv.amount || 8500;
        } else if (data.status === 'PENDING') {
          inv.paidAmount = 0;
        }
      }
    }
    try {
      const dbInv = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });
      if (dbInv) {
        const updatePayload: any = {};
        if (data.amount !== undefined) updatePayload.amount = data.amount;
        if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);
        if (data.status) {
          updatePayload.status = data.status;
          if (data.status === 'PAID') {
            updatePayload.paidAmount = data.amount !== undefined ? data.amount : dbInv.amount;
          } else if (data.status === 'PENDING') {
            updatePayload.paidAmount = 0;
          }
        }

        const updated = await prisma.invoice.update({
          where: { id: invoiceId },
          data: updatePayload
        });
        return updated;
      }
    } catch (e) {
      logDebug("updateInvoice failed", e);
    }
    return inv;
  },

  async resetAnalytics() {
    mockState.invoices = [];
    mockState.expenses = [];
    mockState.complaints = [];
    mockState.visitors = [];
    mockState.leaveRequests = [];

    try {
      await prisma.payment.deleteMany();
      await prisma.invoice.deleteMany();
      await prisma.expense.deleteMany();
      await prisma.complaint.deleteMany();
      await prisma.visitor.deleteMany();
      await prisma.leaveRequest.deleteMany();
      await prisma.salary.deleteMany();
      return true;
    } catch (e) {
      logDebug("resetAnalytics failed", e);
    }
    return false;
  },

  async resetTenants() {
    mockState.users = mockState.users.filter(u => u.role === 'OWNER');
    mockState.tenants = [];
    mockState.invoices = [];
    
    mockState.buildings.forEach(b => {
      b.floors.forEach(f => {
        f.rooms.forEach(r => {
          r.beds.forEach(bed => {
            bed.isAvailable = true;
            bed.tenantId = null;
            bed.tenantName = undefined;
          });
        });
      });
    });

    try {
      await prisma.user.deleteMany({
        where: {
          role: 'TENANT'
        }
      });
      await prisma.bed.updateMany({
        data: {
          isAvailable: true,
          tenantId: null
        }
      });
      return true;
    } catch (e) {
      logDebug("resetTenants failed", e);
    }
    return false;
  }
};

const readMethods = new Set([
  'getUserByEmail',
  'getBuildings',
  'getTenants',
  'getInvoices',
  'getEmployees',
  'getComplaints',
  'getLeaveRequests',
  'getVisitors',
  'getExpenses',
  'getInventory',
  'getNotices'
]);

const cacheStore: Record<string, any> = {};

export const dbService = new Proxy(rawDbService, {
  get(target: any, prop: string) {
    const originalMethod = target[prop];
    if (typeof originalMethod !== 'function') {
      return originalMethod;
    }

    return async function (...args: any[]) {
      // If it's a read method, check cache first
      if (readMethods.has(prop)) {
        const cacheKey = `${prop}:${JSON.stringify(args)}`;
        if (cacheStore[cacheKey] !== undefined) {
          return cacheStore[cacheKey];
        }

        const result = await originalMethod.apply(target, args);
        cacheStore[cacheKey] = result;
        return result;
      }

      // If it's a write method, execute original method and clear all caches
      const result = await originalMethod.apply(target, args);
      for (const key in cacheStore) {
        delete cacheStore[key];
      }
      return result;
    };
  }
}) as typeof rawDbService;
