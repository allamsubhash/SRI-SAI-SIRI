import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { 
  mockTenants, 
  mockBuildings, 
  mockInvoices, 
  mockUsers, 
  mockPayments, 
  mockQRSettings, 
  mockNotificationReads, 
  mockGuidelines,
  mockReminders,
  mockAuditLogs
} from './mockData';
import { 
  computeTenantBillingState, 
  computeFinancialDashboardSummary, 
  calculateBillStatus,
  UnifiedBill, 
  PaymentTransaction, 
  ReminderRecord 
} from './billingService';

const STORE_FILE_PATH = path.join(process.cwd(), '.dev_data_store.json');

interface DevStoreData {
  buildings?: any[];
  tenants?: any[];
  users?: any[];
  invoices?: any[];
  payments?: any[];
  shortStayGuests?: any[];
  guidelines?: any[];
}

function loadDevStore(): DevStoreData {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading dev store from disk:', e);
  }
  return {};
}

function saveDevStore(data: Partial<DevStoreData>) {
  try {
    const existing = loadDevStore();
    const updated = { ...existing, ...data };
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving dev store to disk:', e);
  }
}

// Initialize memory arrays from disk store on module load
const initialDiskData = loadDevStore();
if (Array.isArray(initialDiskData.buildings)) {
  mockBuildings.length = 0;
  mockBuildings.push(...initialDiskData.buildings);
}
if (Array.isArray(initialDiskData.tenants)) {
  mockTenants.length = 0;
  mockTenants.push(...initialDiskData.tenants);
}
if (Array.isArray(initialDiskData.payments)) {
  mockPayments.length = 0;
  mockPayments.push(...initialDiskData.payments);
}
if (Array.isArray(initialDiskData.invoices)) {
  mockInvoices.length = 0;
  mockInvoices.push(...initialDiskData.invoices);
}

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient;
  shortStayGuests?: any[];
};
export const prisma = globalForPrisma.prisma || new PrismaClient();
globalForPrisma.prisma = prisma;
if (Array.isArray(initialDiskData.shortStayGuests)) {
  globalForPrisma.shortStayGuests = initialDiskData.shortStayGuests;
} else if (!globalForPrisma.shortStayGuests) {
  globalForPrisma.shortStayGuests = [];
}

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
    try {
      await ensureDbInitialized();
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

      if (user) {
        return {
          id: user.id,
          email: user.email,
          password: user.password,
          role: user.role,
          name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : 'User',
          tenantId: user.profile?.tenant?.id || null
        };
      }
    } catch (e) {
      logDebug('getUserByEmail error:', e);
    }
    const mockUser = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (mockUser) return mockUser;
    return null;
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
    try {
      let dbBuildings: any[] = [];
      try {
        dbBuildings = await prisma.building.findMany({
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
          },
          orderBy: { createdAt: 'desc' }
        });
      } catch (nestedErr: any) {
        console.warn('[Sri Sai Siri DB Service] Deep getBuildings query failed, attempting basic query:', nestedErr?.message || nestedErr);
        try {
          dbBuildings = await prisma.building.findMany({
            include: {
              floors: {
                include: {
                  rooms: {
                    include: {
                      beds: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          });
        } catch (basicErr: any) {
          console.warn('[Sri Sai Siri DB Service] Basic getBuildings query failed, fetching raw buildings:', basicErr?.message || basicErr);
          dbBuildings = await prisma.building.findMany({
            orderBy: { createdAt: 'desc' }
          });
        }
      }

      console.log(`[Sri Sai Siri DB Service] getBuildings Prisma returned ${dbBuildings?.length || 0} buildings:`, (dbBuildings || []).map((b: any) => `${b.id}:${b.name}`));

      if (dbBuildings) {
        const mapped = dbBuildings.map((b: any) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          floors: (b.floors || []).map((f: any) => ({
            id: f.id,
            number: f.number,
            rooms: (f.rooms || []).map((r: any) => {
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
                beds: (r.beds || []).map((bed: any) => {
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

        mockBuildings.length = 0;
        mockBuildings.push(...(mapped as any));
        return mapped;
      }
    } catch (e: any) {
      console.error('[Sri Sai Siri DB Service] CRITICAL getBuildings Prisma error:', e?.message || e);
      logDebug("getBuildings DB fallback to disk store:", e);
    }

    const diskBuildings = loadDevStore().buildings;
    if (Array.isArray(diskBuildings) && diskBuildings.length > 0) {
      return diskBuildings;
    }
    return mockBuildings;
  },

  async createBuilding(
    nameOrData: string | { name: string; address?: string; floorsCount?: number },
    addressArg?: string,
    floorsCountArg?: number
  ) {
    let name: string;
    let address: string;
    let floorsCount: number;

    if (typeof nameOrData === 'object' && nameOrData !== null) {
      name = nameOrData.name;
      address = nameOrData.address || '';
      floorsCount = nameOrData.floorsCount || 1;
    } else {
      name = String(nameOrData || '');
      address = addressArg || '';
      floorsCount = floorsCountArg || 1;
    }

    const created = await prisma.building.create({
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

    const formatted = {
      id: created.id,
      name: created.name,
      address: created.address,
      floors: (created.floors || []).map(f => ({
        id: f.id,
        number: f.number,
        buildingId: created.id,
        rooms: f.rooms || []
      }))
    };

    mockBuildings.unshift(formatted as any);
    saveDevStore({ buildings: mockBuildings });
    return formatted;
  },

  async updateBuilding(buildingId: string, nameOrData: any, addressArg?: string) {
    const name = typeof nameOrData === 'string' ? nameOrData : nameOrData?.name;
    const address = typeof nameOrData === 'string' ? addressArg : nameOrData?.address;
    const data: any = {};
    if (name) data.name = name;
    if (address) data.address = address;

    try {
      const updated = await prisma.building.update({
        where: { id: buildingId },
        data
      });
      const match = mockBuildings.find(b => b.id === buildingId);
      if (match) {
        if (name) match.name = name;
        if (address) match.address = address;
      }
      saveDevStore({ buildings: mockBuildings });
      return updated;
    } catch (e) {
      logDebug("updateBuilding DB fallback:", e);
      const match = mockBuildings.find(b => b.id === buildingId);
      if (match) {
        if (name) match.name = name;
        if (address) match.address = address;
      }
      saveDevStore({ buildings: mockBuildings });
      return match || { id: buildingId, name, address };
    }
  },

  async deleteBuilding(buildingId: string) {
    try {
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
        throw new Error(`Cannot delete building while active residents are assigned to its rooms.`);
      }

      await prisma.building.delete({
        where: { id: buildingId }
      });
    } catch (e: any) {
      logDebug("deleteBuilding DB fallback:", e);
    }
    const idx = mockBuildings.findIndex(b => b.id === buildingId);
    if (idx !== -1) mockBuildings.splice(idx, 1);
    saveDevStore({ buildings: mockBuildings });
    return true;
  },

  // --- ROOMS ---
  async createRoom(floorIdOrData: any, numberArg?: string, typeArg?: string, rentArg?: number, capacityArg?: number, amenitiesArg?: string) {
    const floorId = typeof floorIdOrData === 'string' ? floorIdOrData : (floorIdOrData?.floorId || '');
    const number = typeof floorIdOrData === 'string' ? (numberArg || '101') : (floorIdOrData?.number || '101');
    const type = typeof floorIdOrData === 'string' ? (typeArg || 'AC Double') : (floorIdOrData?.type || 'AC Double');
    const rent = typeof floorIdOrData === 'string' ? (rentArg || 8500) : (floorIdOrData?.rent || 8500);
    const capacity = typeof floorIdOrData === 'string' ? (capacityArg || 2) : (floorIdOrData?.capacity || 2);
    const amenities = typeof floorIdOrData === 'string' ? amenitiesArg : floorIdOrData?.amenities;

    const roomId = `rm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newBeds = Array.from({ length: capacity }).map((_, i) => ({
      id: `bed-${roomId}-${i + 1}`,
      number: `${number}-${String.fromCharCode(65 + i)}`,
      roomId: roomId,
      tenantId: null,
      isAvailable: true
    }));

    const newRoomObj = {
      id: roomId,
      number,
      type,
      rent,
      status: 'AVAILABLE' as const,
      capacity,
      amenities: amenities ? (typeof amenities === 'string' ? amenities.split(',').map(a => a.trim()) : amenities) : ['AC', 'Wifi'],
      images: [],
      beds: newBeds
    };

    try {
      if (floorId) {
        await prisma.room.create({
          data: {
            id: roomId,
            number,
            type,
            rent,
            capacity,
            amenities: typeof amenities === 'string' ? amenities : (amenities || ['AC', 'Wifi']).join(','),
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
      }
    } catch (e) {
      logDebug("createRoom DB fallback to disk store:", e);
    }

    for (const b of mockBuildings) {
      if (b.floors) {
        for (const fl of b.floors) {
          if (fl.id === floorId || (b.id && floorId && floorId.includes(b.id))) {
            if (!fl.rooms) fl.rooms = [];
            if (!fl.rooms.some((r: any) => r.id === roomId || r.number === number)) {
              fl.rooms.push(newRoomObj);
            }
            break;
          }
        }
      }
    }
    saveDevStore({ buildings: mockBuildings });
    return newRoomObj;
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
      logDebug("updateRoom DB fallback:", e);
    }

    for (const b of mockBuildings) {
      if (b.floors) {
        for (const fl of b.floors) {
          if (fl.rooms) {
            const rm = fl.rooms.find((r: any) => r.id === roomId);
            if (rm) {
              if (data.number) rm.number = data.number;
              if (data.type) rm.type = data.type;
              if (data.rent) rm.rent = data.rent;
              if (data.capacity) rm.capacity = data.capacity;
              if (data.status) rm.status = data.status as any;
            }
          }
        }
      }
    }
    saveDevStore({ buildings: mockBuildings });
    return true;
  },

  async deleteRoom(roomId: string) {
    try {
      await prisma.room.delete({
        where: { id: roomId }
      });
    } catch (e) {
      logDebug("deleteRoom DB fallback:", e);
    }

    for (const b of mockBuildings) {
      if (b.floors) {
        for (const fl of b.floors) {
          if (fl.rooms) {
            const idx = fl.rooms.findIndex((r: any) => r.id === roomId);
            if (idx !== -1) fl.rooms.splice(idx, 1);
          }
        }
      }
    }
    saveDevStore({ buildings: mockBuildings });
    return true;
  },

  // --- TENANTS ---
  async getTenantByUserId(userId: string) {
    if (!userId) return null;
    try {
      const dbTenant = await prisma.tenant.findFirst({
        where: {
          profile: {
            userId: userId
          }
        },
        include: {
          profile: {
            include: {
              user: true
            }
          },
          beds: true
        }
      });

      if (dbTenant) {
        const assignedBed = dbTenant.beds && dbTenant.beds.length > 0 ? dbTenant.beds[0] : null;
        const formattedDate = dbTenant.moveInDate
          ? dbTenant.moveInDate.toISOString().split('T')[0]
          : (dbTenant.profile.moveInDate ? dbTenant.profile.moveInDate.toISOString().split('T')[0] : '2026-01-15');

        return {
          id: dbTenant.id,
          tenantId: dbTenant.id,
          userId: dbTenant.profile.userId,
          name: `${dbTenant.profile.firstName} ${dbTenant.profile.lastName}`.trim(),
          email: dbTenant.profile.user.email,
          phone: dbTenant.profile.phone,
          roomNumber: dbTenant.roomNumber || 'N/A',
          bedNumber: assignedBed ? assignedBed.number : (dbTenant.bedNumber || 'N/A'),
          rentAmount: dbTenant.rentAmount || 8500,
          status: dbTenant.status as any,
          moveInDate: formattedDate,
          joiningDate: formattedDate,
          gender: dbTenant.profile.gender || 'Male',
          aadhaar: dbTenant.profile.aadhaar || '',
          address: dbTenant.profile.address || '',
          emergencyName: dbTenant.profile.emergencyContactName || '',
          emergencyPhone: dbTenant.profile.emergencyContactPhone || '',
          guardianName: dbTenant.profile.guardianName || '',
          guardianPhone: dbTenant.profile.guardianPhone || '',
          occupation: dbTenant.profile.occupation || 'Student',
          medicalNotes: dbTenant.medicalNotes || '',
          agreementUrl: dbTenant.agreementUrl || '',
          photoUrl: dbTenant.profile.photoUrl || ''
        };
      }
    } catch (e) {
      logDebug('getTenantByUserId fallback to mockTenants:', e);
    }

    // Fallback search in mockTenants
    const mockT = mockTenants.find(t => t.userId === userId || t.id === userId);
    return mockT || null;
  },

  async getTenants() {
    try {
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

      if (dbTenants) {
        const mapped = dbTenants.map(t => {
          const assignedBed = t.beds && t.beds.length > 0 ? t.beds[0] : null;
          const formattedDate = t.moveInDate
            ? t.moveInDate.toISOString().split('T')[0]
            : (t.profile?.moveInDate ? t.profile.moveInDate.toISOString().split('T')[0] : '2026-01-15');

          return {
            id: t.id,
            tenantId: t.id,
            userId: t.profile?.userId,
            name: t.profile ? `${t.profile.firstName} ${t.profile.lastName}`.trim() : 'Resident',
            email: t.profile?.user?.email || 'tenant@srisaisiri.com',
            phone: t.profile?.phone || '',
            roomNumber: t.roomNumber || 'N/A',
            bedNumber: assignedBed ? assignedBed.number : (t.bedNumber || 'N/A'),
            rentAmount: t.rentAmount || 8500,
            status: t.status as any,
            moveInDate: formattedDate,
            joiningDate: formattedDate,
            gender: t.profile?.gender || 'Male',
            aadhaar: t.profile?.aadhaar || '',
            address: t.profile?.address || '',
            emergencyName: t.profile?.emergencyContactName || '',
            emergencyPhone: t.profile?.emergencyContactPhone || '',
            guardianName: t.profile?.guardianName || '',
            guardianPhone: t.profile?.guardianPhone || '',
            occupation: t.profile?.occupation || 'Student',
            medicalNotes: t.medicalNotes || '',
            agreementUrl: t.agreementUrl || '',
            photoUrl: t.profile?.photoUrl || ''
          };
        });
        mockTenants.length = 0;
        mockTenants.push(...(mapped as any));
        return mapped;
      }
    } catch (e) {
      logDebug('getTenants fallback to disk/mock store:', e);
    }
    const diskTenants = loadDevStore().tenants;
    if (Array.isArray(diskTenants)) {
      return diskTenants;
    }
    return mockTenants;
  },

  async getTenantRoommates(tenantId: string) {
    if (!tenantId) return [];
    try {
      const targetTenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { beds: { include: { room: true } } }
      });

      if (!targetTenant) return [];

      const targetRoomId = targetTenant.roomId || (targetTenant.beds && targetTenant.beds.length > 0 ? targetTenant.beds[0].roomId : null);
      const targetRoomNumber = targetTenant.roomNumber || (targetTenant.beds && targetTenant.beds.length > 0 ? targetTenant.beds[0].room.number : null);

      if (!targetRoomId && !targetRoomNumber) return [];

      const roommates = await prisma.tenant.findMany({
        where: {
          status: 'ACTIVE',
          id: { not: targetTenant.id },
          OR: [
            targetRoomId ? { roomId: targetRoomId } : {},
            targetRoomNumber ? { roomNumber: { equals: targetRoomNumber.trim() } } : {}
          ]
        },
        include: {
          profile: true,
          beds: true
        }
      });

      return roommates.map((t, idx) => {
        const assignedBed = t.beds && t.beds.length > 0 ? t.beds[0] : null;
        return {
          id: t.id,
          tenantId: t.id,
          userId: t.profile.userId,
          name: `${t.profile.firstName} ${t.profile.lastName}`.trim(),
          phone: t.profile.phone,
          roomNumber: t.roomNumber || targetRoomNumber || 'N/A',
          bedNumber: assignedBed ? assignedBed.number : (t.bedNumber || 'N/A'),
          occupation: t.profile.occupation || 'Resident',
          photoUrl: t.profile.photoUrl || ''
        };
      });
    } catch (e) {
      logDebug('getTenantRoommates error:', e);
    }
    const mockCurrent = mockTenants.find(t => t.id === tenantId || t.userId === tenantId);
    if (!mockCurrent) return [];
    return mockTenants.filter(t => 
      t.status === 'ACTIVE' && 
      t.id !== mockCurrent.id && 
      (t.roomNumber || '').toLowerCase().replace(/^room\s*/i, '').trim() === (mockCurrent.roomNumber || '').toLowerCase().replace(/^room\s*/i, '').trim()
    );
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

    try {
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

        // 5. Create initial rent invoice for newly registered tenant
        const now = new Date();
        const currentMonthStr = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);
        const invNumber = `INV-${Date.now().toString().slice(-6)}`;
        await tx.invoice.create({
          data: {
            id: `inv-${createdTenant.id}`,
            number: invNumber,
            tenantId: createdTenant.id,
            amount: data.rentAmount || 8500,
            paidAmount: 0,
            dueDate: dueDate,
            status: now.getDate() > 5 ? 'OVERDUE' : 'PENDING',
            itemsJson: JSON.stringify([{ description: `Monthly Hostel Rent - ${currentMonthStr}`, amount: data.rentAmount || 8500 }])
          }
        });

        return {
          id: createdTenant.id,
          userId: createdUser.id,
          name: `${firstName} ${lastName}`.trim(),
          email: cleanEmail,
          phone: data.phone,
          roomNumber: createdTenant.roomNumber,
          bedNumber: createdTenant.bedNumber,
          rentAmount: createdTenant.rentAmount,
          status: 'ACTIVE',
          password: passwordHash
        };
      });
    } catch (e) {
      logDebug('createTenant fallback to mockTenants:', e);
      const newMockTenant: any = {
        id: tenantId,
        userId,
        profileId,
        name: `${firstName} ${lastName}`.trim(),
        email: cleanEmail,
        phone: data.phone || '+91 98765 43210',
        roomNumber: data.roomNumber || 'N/A',
        bedNumber: data.bedNumber || 'N/A',
        rentAmount: data.rentAmount || 8500,
        moveInDate: data.moveInDate || '2026-01-15',
        joiningDate: data.moveInDate || '2026-01-15',
        status: 'ACTIVE',
        address: data.address || '',
        aadhaar: data.aadhaar || '',
        emergencyName: data.emergencyName || '',
        emergencyPhone: data.emergencyPhone || '',
        guardianName: data.guardianName || '',
        guardianPhone: data.guardianPhone || '',
        occupation: data.occupation || 'Student',
        gender: data.gender || 'Male',
        password: passwordHash
      };
      mockTenants.push(newMockTenant);

      const now = new Date();
      const currentMonthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0];
      const invNumber = `INV-${Date.now().toString().slice(-6)}`;
      const initialInvoice: any = {
        id: `inv-${tenantId}`,
        number: invNumber,
        tenantId: tenantId,
        tenantName: newMockTenant.name,
        roomNumber: newMockTenant.roomNumber,
        bedNumber: newMockTenant.bedNumber,
        amount: data.rentAmount || 8500,
        paidAmount: 0,
        dueDate: dueDate,
        billingPeriod: currentMonthStr,
        status: now.getDate() > 5 ? 'OVERDUE' : 'PENDING',
        items: [{ description: `Monthly Hostel Rent - ${currentMonthStr}`, amount: data.rentAmount || 8500 }]
      };
      mockInvoices.push(initialInvoice);

      if (data.bedNumber) {
        for (const b of mockBuildings) {
          for (const fl of b.floors || []) {
            for (const rm of fl.rooms || []) {
              for (const bd of rm.beds || []) {
                if (bd.number === data.bedNumber) {
                  bd.isAvailable = false;
                  bd.tenantId = tenantId;
                }
              }
            }
          }
        }
        saveDevStore({ buildings: mockBuildings });
      }
      saveDevStore({ tenants: mockTenants, invoices: mockInvoices });
      return newMockTenant;
    }
  },

  async updateTenantProfile(tenantId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    moveInDate?: string;
    password?: string;
    roomNumber?: string;
    bedNumber?: string;
    rentAmount?: number;
    address?: string;
    aadhaar?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    guardianName?: string;
    guardianPhone?: string;
    occupation?: string;
    medicalNotes?: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const dbTenant = await tx.tenant.findUnique({
          where: { id: tenantId },
          include: { profile: true }
        });

        if (!dbTenant) throw new Error('Tenant record not found.');

        // Update User email/password if provided
        if (data.email || data.password) {
          const userUpdate: any = {};
          if (data.email) userUpdate.email = data.email.trim().toLowerCase();
          if (data.password) userUpdate.password = bcrypt.hashSync(data.password, 10);
          await tx.user.update({
            where: { id: dbTenant.profile.userId },
            data: userUpdate
          });
        }

        // Update Profile
        const names = data.name ? data.name.trim().split(' ') : null;
        const firstName = names ? (names[0] || 'Tenant') : undefined;
        const lastName = names ? (names.slice(1).join(' ') || '') : undefined;

        const profileUpdate: any = {};
        if (firstName !== undefined) profileUpdate.firstName = firstName;
        if (lastName !== undefined) profileUpdate.lastName = lastName;
        if (data.phone !== undefined) profileUpdate.phone = data.phone;
        if (data.gender !== undefined) profileUpdate.gender = data.gender;
        if (data.moveInDate !== undefined) profileUpdate.moveInDate = new Date(data.moveInDate);
        if (data.address !== undefined) profileUpdate.address = data.address;
        if (data.aadhaar !== undefined) profileUpdate.aadhaar = data.aadhaar;
        if (data.emergencyName !== undefined) profileUpdate.emergencyContactName = data.emergencyName;
        if (data.emergencyPhone !== undefined) profileUpdate.emergencyContactPhone = data.emergencyPhone;
        if (data.guardianName !== undefined) profileUpdate.guardianName = data.guardianName;
        if (data.guardianPhone !== undefined) profileUpdate.guardianPhone = data.guardianPhone;
        if (data.occupation !== undefined) profileUpdate.occupation = data.occupation;

        if (Object.keys(profileUpdate).length > 0) {
          await tx.profile.update({
            where: { id: dbTenant.profileId },
            data: profileUpdate
          });
        }

        // Handle Bed reallocation if bedNumber changed
        let newRoomId: string | undefined = undefined;
        if (data.bedNumber && data.bedNumber !== dbTenant.bedNumber) {
          // Free old bed
          await tx.bed.updateMany({
            where: { tenantId: tenantId },
            data: { tenantId: null, isAvailable: true }
          });

          // Occupy new bed
          const newBed = await tx.bed.findFirst({
            where: { number: { equals: data.bedNumber.trim() } },
            include: { room: true }
          });

          if (newBed) {
            await tx.bed.update({
              where: { id: newBed.id },
              data: { tenantId: tenantId, isAvailable: false }
            });
            newRoomId = newBed.roomId;
          }
        }

        // Update Tenant
        const tenantUpdate: any = {};
        if (data.roomNumber !== undefined) tenantUpdate.roomNumber = data.roomNumber;
        if (data.bedNumber !== undefined) tenantUpdate.bedNumber = data.bedNumber;
        if (data.rentAmount !== undefined) tenantUpdate.rentAmount = data.rentAmount;
        if (data.medicalNotes !== undefined) tenantUpdate.medicalNotes = data.medicalNotes;
        if (data.moveInDate !== undefined) tenantUpdate.moveInDate = new Date(data.moveInDate);
        if (newRoomId) tenantUpdate.roomId = newRoomId;

        return await tx.tenant.update({
          where: { id: tenantId },
          data: tenantUpdate
        });
      });
    } catch (e) {
      logDebug('updateTenantProfile fallback to mockTenants:', e);
      const mockT = mockTenants.find(t => t.id === tenantId);
      if (mockT) {
        if (data.name !== undefined) mockT.name = data.name;
        if (data.email !== undefined) mockT.email = data.email;
        if (data.phone !== undefined) mockT.phone = data.phone;
        if (data.gender !== undefined) mockT.gender = data.gender;
        if (data.moveInDate !== undefined) mockT.moveInDate = data.moveInDate;
        if (data.roomNumber !== undefined) mockT.roomNumber = data.roomNumber;
        if (data.bedNumber !== undefined) mockT.bedNumber = data.bedNumber;
        if (data.rentAmount !== undefined) mockT.rentAmount = data.rentAmount;
        if (data.address !== undefined) mockT.address = data.address;
        if (data.aadhaar !== undefined) mockT.aadhaar = data.aadhaar;
        if (data.emergencyName !== undefined) mockT.emergencyName = data.emergencyName;
        if (data.emergencyPhone !== undefined) mockT.emergencyPhone = data.emergencyPhone;
        if (data.guardianName !== undefined) mockT.guardianName = data.guardianName;
        if (data.guardianPhone !== undefined) mockT.guardianPhone = data.guardianPhone;
        if (data.occupation !== undefined) mockT.occupation = data.occupation;
        if (data.medicalNotes !== undefined) mockT.medicalNotes = data.medicalNotes;
        saveDevStore({ tenants: mockTenants });
        return mockT;
      }
      return { id: tenantId, ...data };
    }
  },

  async updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'ARCHIVED' | 'BLACKLISTED') {
    try {
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
    } catch (e) {
      logDebug('updateTenantStatus fallback to mockTenants:', e);
      const mockT = mockTenants.find(t => t.id === tenantId);
      if (mockT) {
        mockT.status = status;
        if (status !== 'ACTIVE') {
          for (const b of mockBuildings as any[]) {
            const roomsList = b.rooms || (b.floors ? b.floors.flatMap((f: any) => f.rooms || []) : []);
            for (const r of roomsList) {
              for (const bed of r.beds || []) {
                if (bed.tenantId === tenantId || (mockT.bedNumber && bed.number === mockT.bedNumber)) {
                  bed.isAvailable = true;
                  bed.tenantId = undefined;
                }
              }
            }
          }
        }
        saveDevStore({ tenants: mockTenants, buildings: mockBuildings });
      }
      return mockT || { id: tenantId, status };
    }
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
    try {
      const dbInvoices = await prisma.invoice.findMany({
        include: {
          tenant: {
            include: { profile: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (dbInvoices) {
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
            itemsJson: inv.itemsJson,
            dateCreated: inv.createdAt.toISOString().split('T')[0]
          };
        });
      }
    } catch (e) {
      logDebug('getInvoices fallback to disk/mock store:', e);
    }
    const diskInvoices = loadDevStore().invoices;
    if (Array.isArray(diskInvoices)) {
      return diskInvoices;
    }
    return mockInvoices;
  },

  async getTenantFinancialSummary(tenantIdentifier: string) {
    try {
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

      if (dbTenant) {
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
        const cleanInvoiced = Number(totalInvoiced.toFixed(2));
        const cleanPaid = Number(totalPaid.toFixed(2));
        const rawOutstanding = cleanInvoiced - cleanPaid;
        const outstandingAmount = Math.max(0, Number(rawOutstanding.toFixed(2)));

        const mostRecentPayment = allPaidPayments[0] || null;
        const lastPaymentAmount = mostRecentPayment ? mostRecentPayment.amount : 0;
        const lastPaymentDate = mostRecentPayment ? mostRecentPayment.createdAt.toISOString().split('T')[0] : null;

        const dueDateStr = new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0];
        const computedStatus = calculateBillStatus(cleanInvoiced, cleanPaid, dueDateStr, false, new Date());
        const paymentStatus = computedStatus === 'PARTIAL' ? 'PARTIAL' : computedStatus === 'OVERDUE' ? 'OVERDUE' : computedStatus === 'PAID' ? 'PAID' : 'PENDING';

        return {
          tenantId: dbTenant.id,
          monthlyRent,
          totalInvoiced: cleanInvoiced,
          totalPaid: cleanPaid,
          outstandingAmount,
          lastPaymentAmount,
          lastPaymentDate,
          paymentStatus
        };
      }
    } catch (e) {
      logDebug('getTenantFinancialSummary fallback:', e);
    }

    const mockT = mockTenants.find(t => t.id === tenantIdentifier || t.userId === tenantIdentifier || t.email === tenantIdentifier);
    if (!mockT) {
      return {
        tenantId: tenantIdentifier,
        monthlyRent: 8500,
        totalRent: 0,
        totalInvoiced: 0,
        totalVerifiedPaid: 0,
        totalPaid: 0,
        pendingVerification: 0,
        outstandingAmount: 0,
        balance: 0,
        paymentStatus: 'PAID'
      };
    }

    const tenantInvoices = mockInvoices.filter(i => i.tenantId === mockT.id || i.tenantName === mockT.name);
    const tenantPayments = mockPayments.filter(p => p.tenantId === mockT.id || p.tenantName === mockT.name);

    const totalRent = tenantInvoices.length > 0 
      ? tenantInvoices.reduce((s, i) => s + i.amount, 0) 
      : (mockT.rentAmount || 8500);

    const verifiedPayments = tenantPayments.filter(p => (p.status as string) === 'VERIFIED' || p.status === 'APPROVED' || p.status === 'PAID');
    const pendingPayments = tenantPayments.filter(p => (p.status as string) === 'PENDING_VERIFICATION' || p.status === 'PENDING');

    const totalVerifiedPaid = Number(verifiedPayments.reduce((s, p) => s + p.amount, 0).toFixed(2));
    const pendingVerification = Number(pendingPayments.reduce((s, p) => s + p.amount, 0).toFixed(2));
    const balance = Math.max(0, Number((totalRent - totalVerifiedPaid).toFixed(2)));

    const dueDateStr = new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0];
    const computedStatus = calculateBillStatus(totalRent, totalVerifiedPaid, dueDateStr, false, new Date());

    return {
      tenantId: mockT.id,
      monthlyRent: mockT.rentAmount || 8500,
      totalRent,
      totalInvoiced: totalRent,
      totalVerifiedPaid,
      totalPaid: totalVerifiedPaid,
      pendingVerification,
      outstandingAmount: balance,
      balance,
      paymentStatus: (computedStatus === 'PARTIAL' ? 'PARTIALLY_PAID' : computedStatus === 'OVERDUE' ? 'OVERDUE' : computedStatus === 'PAID' ? 'PAID' : 'DUE') as any
    };
  },

  async createInvoice(tenantId: string, amount: number, items: { description: string; amount: number }[], dueDate: string) {
    const invId = `inv-${Date.now()}`;
    const invNumber = `INV-2026-${String(Date.now()).slice(-4)}`;

    try {
      const dbTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { id: tenantId },
            { profile: { userId: tenantId } }
          ]
        }
      });

      if (dbTenant) {
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
      }
    } catch (e) {
      logDebug('createInvoice fallback:', e);
    }

    const invObj: any = {
      id: invId,
      number: invNumber,
      tenantId,
      tenantName: 'Tenant',
      roomNumber: 'A-101',
      amount,
      paidAmount: 0,
      dueDate,
      status: 'PENDING',
      items,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    mockInvoices.unshift(invObj);
    return invObj;
  },

  async recordPayment(
    invoiceIdOrData: string | {
      invoiceId?: string;
      tenantId: string;
      amount: number;
      paymentMethod: string;
      paymentType?: string;
      referenceId?: string;
      paymentDate?: string;
      notes?: string;
      recordedBy?: string;
    },
    amountArg?: number,
    methodArg?: string,
    isTenantPaymentArg: boolean = false
  ) {
    let invoiceId: string | undefined;
    let tenantId: string | undefined;
    let amount: number;
    let method: string;
    let paymentType: string = 'Monthly Rent';
    let referenceId: string | undefined;
    let paymentDate: string = new Date().toISOString().split('T')[0];
    let notes: string = '';
    let recordedBy: string = 'Manager';
    let isTenantPayment: boolean = false;

    if (typeof invoiceIdOrData === 'object') {
      invoiceId = invoiceIdOrData.invoiceId;
      tenantId = invoiceIdOrData.tenantId;
      amount = Number(invoiceIdOrData.amount);
      method = invoiceIdOrData.paymentMethod || 'UPI';
      paymentType = invoiceIdOrData.paymentType || 'Monthly Rent';
      referenceId = invoiceIdOrData.referenceId;
      paymentDate = invoiceIdOrData.paymentDate || paymentDate;
      notes = invoiceIdOrData.notes || '';
      recordedBy = invoiceIdOrData.recordedBy || 'Manager';
    } else {
      invoiceId = invoiceIdOrData;
      amount = Number(amountArg) || 0;
      method = methodArg || 'UPI';
      isTenantPayment = !!isTenantPaymentArg;
    }

    const receiptNo = `SSR-RCP-${Date.now().toString().slice(-6)}`;
    const paymentId = `pay-${Date.now()}`;

    // Duplicate referenceId check
    if (referenceId && referenceId.trim().length > 0) {
      const trimmedRef = referenceId.trim();
      const existingRef = mockPayments.find(p => p.referenceId === trimmedRef && p.id !== paymentId && p.status !== 'REJECTED');
      if (existingRef) {
        throw new Error(`A transaction with reference ID '${trimmedRef}' already exists in the system.`);
      }
    }

    try {
      return await prisma.$transaction(async (tx) => {
        let dbInv = invoiceId ? await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { tenant: { include: { profile: true } } }
        }) : null;

        if (!dbInv && tenantId) {
          dbInv = await tx.invoice.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { tenant: { include: { profile: true } } }
          });
        }

        const resolvedTenantId = dbInv?.tenantId || tenantId;
        if (!resolvedTenantId) throw new Error('Target tenant or invoice record not found.');

        if (isTenantPayment) {
          return await tx.payment.create({
            data: {
              id: paymentId,
              amount,
              type: paymentType,
              paymentMethod: method,
              status: 'PENDING',
              tenantId: resolvedTenantId,
              invoiceId: dbInv ? dbInv.id : null,
              referenceId: referenceId || null,
              notes: notes || null
            }
          });
        }

        const tenantName = dbInv?.tenant ? `${dbInv.tenant.profile.firstName} ${dbInv.tenant.profile.lastName}`.trim() : 'Tenant';

        const createdPayment = await tx.payment.create({
          data: {
            id: paymentId,
            amount,
            type: paymentType,
            paymentMethod: method,
            status: 'PAID',
            invoiceId: dbInv ? dbInv.id : null,
            tenantId: resolvedTenantId,
            referenceId: referenceId || null,
            notes: notes || null
          }
        });

        if (dbInv) {
          const newPaid = Math.min(dbInv.amount, (dbInv.paidAmount || 0) + amount);
          const newStatus = newPaid >= dbInv.amount ? 'PAID' : 'PARTIAL';
          await tx.invoice.update({
            where: { id: dbInv.id },
            data: { paidAmount: newPaid, status: newStatus }
          });
        }

        // Log audit log
        try {
          await tx.auditLog.create({
            data: {
              id: `audit-${Date.now()}`,
              action: 'PAYMENT_RECORDED',
              details: `Recorded ₹${amount.toLocaleString()} payment for ${tenantName} via ${method}. Reference: ${referenceId || 'N/A'}`
            }
          });
        } catch {}

        return createdPayment;
      });
    } catch (e: any) {
      logDebug('recordPayment DB fallback:', e);
      if (e.message?.includes('already exists')) throw e;
    }

    // In-memory fallback
    let targetInv = invoiceId ? mockInvoices.find(i => i.id === invoiceId) : null;
    if (!targetInv && tenantId) {
      targetInv = mockInvoices.find(i => i.tenantId === tenantId);
    }

    const resolvedTenantId = targetInv?.tenantId || tenantId || 't-1';
    const resolvedTenant = mockTenants.find(t => t.id === resolvedTenantId);
    const tenantName = resolvedTenant ? resolvedTenant.name : (targetInv ? targetInv.tenantName : 'Resident');

    const newPaymentRecord = {
      id: paymentId,
      tenantId: resolvedTenantId,
      tenantName,
      invoiceId: targetInv ? targetInv.id : undefined,
      amount,
      date: paymentDate,
      type: paymentType,
      paymentMethod: method,
      status: (isTenantPayment ? 'PENDING' : 'APPROVED') as any,
      referenceId: referenceId || undefined,
      notes: notes || undefined,
      recordedBy,
      receiptNumber: receiptNo,
      createdAt: new Date().toISOString()
    };
    mockPayments.unshift(newPaymentRecord);

    if (targetInv && !isTenantPayment) {
      targetInv.paidAmount = Math.min(targetInv.amount, (targetInv.paidAmount || 0) + amount);
      targetInv.status = targetInv.paidAmount >= targetInv.amount ? 'PAID' : 'PARTIAL';
    }

    // Log to mock audit logs
    mockAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'PAYMENT_RECORDED',
      userName: recordedBy,
      entityId: paymentId,
      details: `Recorded payment of ₹${amount.toLocaleString()} for ${tenantName} (${targetInv?.billingMonth || 'Rent'}). Reference: ${referenceId || 'N/A'}`,
      createdAt: new Date().toISOString()
    });

    return newPaymentRecord;
  },

  async verifyInvoicePayment(invoiceId: string, remarks: string = 'Verified online payment', verifiedBy: string = 'Owner') {
    try {
      return await prisma.$transaction(async (tx) => {
        const dbInv = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true, tenant: { include: { profile: true } } }
        });

        if (!dbInv) throw new Error('Invoice not found.');

        const pendingPayment = dbInv.payments.find(p => p.status === 'PENDING');
        const verifyAmount = pendingPayment ? pendingPayment.amount : Math.max(0, dbInv.amount - dbInv.paidAmount);

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

        const newPaidAmount = Math.min(dbInv.amount, dbInv.paidAmount + verifyAmount);
        const newStatus = newPaidAmount >= dbInv.amount ? 'PAID' : 'PARTIAL';

        return await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus
          }
        });
      });
    } catch (e) {
      logDebug('verifyInvoicePayment fallback:', e);
    }

    const inv = mockInvoices.find(i => i.id === invoiceId);
    if (inv) {
      const pendingPayment = mockPayments.find(p => p.invoiceId === invoiceId && p.status === 'PENDING');
      const verifyAmount = pendingPayment ? pendingPayment.amount : (inv.amount - (inv.paidAmount || 0));
      if (pendingPayment) {
        pendingPayment.status = 'APPROVED';
      }
      inv.paidAmount = Math.min(inv.amount, (inv.paidAmount || 0) + verifyAmount);
      inv.status = inv.paidAmount >= inv.amount ? 'PAID' : 'PARTIAL';
    }
    return inv || { id: invoiceId, status: 'PAID' };
  },

  async revertInvoicePayment(invoiceId: string, remarks: string = 'Payment reverted by owner', reversedBy: string = 'Owner') {
    try {
      return await prisma.$transaction(async (tx) => {
        const dbInv = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { payments: true }
        });

        if (!dbInv) throw new Error('Invoice not found.');

        await tx.payment.updateMany({
          where: { invoiceId },
          data: { status: 'REVERSED' }
        });

        return await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: 0,
            status: 'PENDING'
          }
        });
      });
    } catch (e) {
      logDebug('revertInvoicePayment fallback:', e);
    }

    const inv = mockInvoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.paidAmount = 0;
      inv.status = 'PENDING';
      mockPayments.filter(p => p.invoiceId === invoiceId).forEach(p => p.status = 'REVERSED');
    }
    return inv || { id: invoiceId, paidAmount: 0, status: 'PENDING' };
  },

  async deleteInvoice(invoiceId: string) {
    try {
      return await prisma.invoice.delete({
        where: { id: invoiceId }
      });
    } catch (e) {
      logDebug('deleteInvoice fallback:', e);
    }
    const idx = mockInvoices.findIndex(i => i.id === invoiceId);
    if (idx !== -1) mockInvoices.splice(idx, 1);
    return true;
  },

  async updateInvoice(invoiceId: string, data: { amount?: number; dueDate?: string; month?: string; status?: string }) {
    const updatePayload: any = {};
    if (data.amount !== undefined) updatePayload.amount = data.amount;
    if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);
    if (data.status) {
      updatePayload.status = data.status;
      if (data.status === 'PAID') {
        const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } }).catch(() => null);
        if (inv) updatePayload.paidAmount = data.amount !== undefined ? data.amount : inv.amount;
      } else if (data.status === 'PENDING') {
        updatePayload.paidAmount = 0;
      }
    }

    try {
      return await prisma.invoice.update({
        where: { id: invoiceId },
        data: updatePayload
      });
    } catch (e) {
      logDebug('updateInvoice fallback:', e);
    }

    const inv = mockInvoices.find(i => i.id === invoiceId);
    if (inv) {
      if (data.amount !== undefined) inv.amount = data.amount;
      if (data.dueDate !== undefined) inv.dueDate = data.dueDate;
      if (data.status) inv.status = data.status as any;
      if (data.status === 'PAID') inv.paidAmount = inv.amount;
      else if (data.status === 'PENDING') inv.paidAmount = 0;
    }
    return inv || { id: invoiceId, ...data };
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
  async purgeAllData() {
    try {
      // 1. Transactional and child records
      await prisma.payment.deleteMany({}).catch(() => null);
      await prisma.invoice.deleteMany({}).catch(() => null);
      await prisma.complaint.deleteMany({}).catch(() => null);
      await prisma.visitor.deleteMany({}).catch(() => null);
      await prisma.leaveRequest.deleteMany({}).catch(() => null);
      await prisma.maintenance.deleteMany({}).catch(() => null);
      await prisma.expense.deleteMany({}).catch(() => null);
      await prisma.notice.deleteMany({}).catch(() => null);
      await prisma.notificationRead.deleteMany({}).catch(() => null);
      await prisma.salary.deleteMany({}).catch(() => null);
      await prisma.employee.deleteMany({}).catch(() => null);
      await prisma.shortStayGuest.deleteMany({}).catch(() => null);

      // 2. Tenants and Beds
      await prisma.bed.deleteMany({}).catch(() => null);
      await prisma.tenant.deleteMany({}).catch(() => null);

      // 3. Rooms, Floors, and Buildings
      await prisma.room.deleteMany({}).catch(() => null);
      await prisma.floor.deleteMany({}).catch(() => null);
      await prisma.building.deleteMany({}).catch(() => null);

      // 4. Profiles & Non-owner Users
      const ownerUser = await prisma.user.findFirst({
        where: { email: 'owner@srisaisiri.com' }
      });

      if (ownerUser) {
        await prisma.profile.deleteMany({
          where: { userId: { not: ownerUser.id } }
        }).catch(() => null);
        await prisma.user.deleteMany({
          where: { id: { not: ownerUser.id } }
        }).catch(() => null);
      } else {
        await prisma.profile.deleteMany({}).catch(() => null);
        await prisma.user.deleteMany({}).catch(() => null);
      }

      await prisma.setting.deleteMany({}).catch(() => null);
      await prisma.guideline.deleteMany({}).catch(() => null);
    } catch (e) {
      console.error('[Sri Sai Siri DB Service] purgeAllData error:', e);
    }

    mockBuildings.length = 0;
    mockTenants.length = 0;
    mockInvoices.length = 0;
    mockPayments.length = 0;
    saveDevStore({
      buildings: [],
      tenants: [],
      invoices: [],
      payments: [],
      shortStayGuests: [],
      guidelines: []
    });

    return true;
  },

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
      })),
      tenants: await this.getTenants()
    };
  },

  // --- PAYMENT HISTORY, WORKSPACE & BANK-GRADE LEDGER ---
  async getPaymentsWorkspace(filters?: {
    month?: string;
    buildingId?: string;
    status?: string;
    search?: string;
  }) {
    const tenants = await this.getTenants();
    const rawInvoices = await this.getInvoices();
    const rawPayments = await this.getAllPayments();
    const rawReminders = mockReminders;
    const rawAuditLogs = mockAuditLogs;

    // Compute single source of truth billing states for each tenant
    const allUnifiedBills: UnifiedBill[] = [];
    const processedTenantIds = new Set<string>();

    for (const tenant of tenants) {
      processedTenantIds.add(tenant.id);
      const billingState = computeTenantBillingState(tenant, rawInvoices, rawPayments, rawReminders);
      allUnifiedBills.push(...billingState.invoices);
    }

    // Include any standalone invoices not directly linked to current active tenants
    for (const inv of rawInvoices) {
      if (!processedTenantIds.has(inv.tenantId)) {
        const dummyTenant = { id: inv.tenantId, name: inv.tenantName, roomNumber: inv.roomNumber || 'A-101' };
        const billingState = computeTenantBillingState(dummyTenant, [inv], rawPayments, rawReminders);
        allUnifiedBills.push(...billingState.invoices);
      }
    }

    // Filter by Building
    let filteredBills = allUnifiedBills;
    if (filters?.buildingId && filters.buildingId !== 'ALL') {
      const bId = filters.buildingId;
      filteredBills = filteredBills.filter(b => 
        b.buildingId === bId || 
        b.buildingName.toLowerCase().includes(bId.toLowerCase()) ||
        (bId === 'b-1' && b.roomNumber.startsWith('A')) ||
        (bId === 'b-2' && b.roomNumber.startsWith('B'))
      );
    }

    // Filter by Month
    if (filters?.month && filters.month !== 'ALL') {
      const m = filters.month;
      filteredBills = filteredBills.filter(b => 
        b.billingMonth?.toLowerCase() === m.toLowerCase() ||
        b.billingPeriod?.toLowerCase() === m.toLowerCase() ||
        (b.dueDate ? b.dueDate.startsWith(m) : false)
      );
    }

    // Filter by Status
    if (filters?.status && filters.status !== 'ALL') {
      if (filters.status === 'VERIFICATION_PENDING') {
        filteredBills = filteredBills.filter(b => b.status === 'VERIFICATION_PENDING' || b.pendingVerificationCount > 0);
      } else {
        filteredBills = filteredBills.filter(b => b.status === filters.status);
      }
    }

    // Filter by Search Query
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      filteredBills = filteredBills.filter(b => 
        b.tenantName.toLowerCase().includes(q) ||
        b.roomNumber.toLowerCase().includes(q) ||
        b.number.toLowerCase().includes(q) ||
        b.transactions.some(t => (t.referenceId && t.referenceId.toLowerCase().includes(q)) || (t.id && t.id.toLowerCase().includes(q)))
      );
    }

    // Financial metrics summary
    const summary = computeFinancialDashboardSummary(allUnifiedBills);

    // Pending Verification Queue
    const verificationQueue = rawPayments.filter(p => p.status === 'PENDING');

    // All distinct transactions ledger
    const transactionsLedger = rawPayments;

    return {
      summary,
      bills: filteredBills,
      allBills: allUnifiedBills,
      verificationQueue,
      transactionsLedger,
      reminders: rawReminders,
      auditLogs: rawAuditLogs
    };
  },

  async getTenantPaymentHistory(tenantId: string) {
    try {
      const dbPayments = await prisma.payment.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' }
      });
      if (dbPayments && dbPayments.length > 0) {
        return dbPayments.map(p => ({
          id: p.id,
          tenantId: p.tenantId,
          amount: p.amount,
          date: p.date.toISOString().split('T')[0],
          type: p.type,
          paymentMethod: p.paymentMethod,
          status: p.status,
          referenceId: p.referenceId,
          notes: p.notes,
          rejectionReason: p.rejectionReason,
          createdAt: p.createdAt.toISOString()
        }));
      }
    } catch (e) {
      logDebug('getTenantPaymentHistory fallback to mockPayments:', e);
    }
    return mockPayments
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getAllPayments() {
    try {
      const dbPayments = await prisma.payment.findMany({
        include: {
          tenant: {
            include: {
              profile: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });
      if (dbPayments && dbPayments.length > 0) {
        return dbPayments.map(p => ({
          id: p.id,
          tenantId: p.tenantId,
          tenantName: p.tenant?.profile ? `${p.tenant.profile.firstName} ${p.tenant.profile.lastName}`.trim() : 'Resident',
          amount: p.amount,
          date: p.date.toISOString().split('T')[0],
          type: p.type,
          paymentMethod: p.paymentMethod,
          status: p.status,
          referenceId: p.referenceId,
          notes: p.notes,
          rejectionReason: p.rejectionReason,
          createdAt: p.createdAt.toISOString()
        }));
      }
    } catch (e) {
      logDebug('getAllPayments fallback to disk/mock store:', e);
    }
    const diskPayments = loadDevStore().payments;
    if (Array.isArray(diskPayments)) {
      return [...diskPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [...mockPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async submitTenantPayment(data: {
    tenantId: string;
    amount: number;
    paymentMethod: string;
    referenceId?: string;
    screenshotUrl?: string;
    notes?: string;
  }) {
    const paymentId = `pay-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    if (data.referenceId && data.referenceId.trim().length > 0) {
      const trimmedRef = data.referenceId.trim();
      const existingRef = mockPayments.find(p => p.referenceId === trimmedRef && p.status !== 'REJECTED');
      if (existingRef) {
        throw new Error(`A payment with transaction UTR / reference ID '${trimmedRef}' has already been submitted.`);
      }
    }

    try {
      if (data.referenceId && data.referenceId.trim().length > 0) {
        const existingRef = await prisma.payment.findFirst({
          where: { referenceId: { equals: data.referenceId.trim() } }
        });
        if (existingRef) {
          throw new Error(`A payment with transaction UTR / reference ID '${data.referenceId}' has already been submitted.`);
        }
      }

      const created = await prisma.payment.create({
        data: {
          id: paymentId,
          tenantId: data.tenantId,
          amount: data.amount,
          date: new Date(),
          type: 'Monthly Rent',
          paymentMethod: data.paymentMethod,
          status: 'PENDING',
          referenceId: data.referenceId || null,
          notes: data.notes || null
        }
      });
      return {
        id: created.id,
        tenantId: created.tenantId,
        amount: created.amount,
        date: todayStr,
        type: created.type,
        paymentMethod: created.paymentMethod,
        status: created.status,
        referenceId: created.referenceId,
        notes: created.notes,
        createdAt: created.createdAt.toISOString()
      };
    } catch (e: any) {
      logDebug('submitTenantPayment DB fallback:', e);
      if (e.message?.includes('already been submitted')) {
        throw e;
      }
    }

    const mockPayObj = {
      id: paymentId,
      tenantId: data.tenantId,
      tenantName: mockTenants.find(t => t.id === data.tenantId)?.name || 'Resident',
      amount: data.amount,
      date: todayStr,
      type: 'Monthly Rent',
      paymentMethod: data.paymentMethod,
      status: 'PENDING_VERIFICATION' as const,
      referenceId: data.referenceId,
      screenshotUrl: data.screenshotUrl,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };
    mockPayments.unshift(mockPayObj);

    // Audit log
    mockAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'PAYMENT_SUBMITTED',
      userName: mockPayObj.tenantName,
      entityId: paymentId,
      details: `Tenant submitted ₹${data.amount.toLocaleString()} payment for verification (UTR: ${data.referenceId || 'N/A'})`,
      createdAt: new Date().toISOString()
    });

    saveDevStore({ payments: mockPayments });
    return mockPayObj;
  },

  async approvePayment(paymentId: string, approvedBy: string = 'Hostel Owner') {
    return this.approveTenantPayment(paymentId, approvedBy);
  },

  async approveTenantPayment(paymentId: string, approvedBy: string = 'Hostel Owner') {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.payment.findUnique({
          where: { id: paymentId }
        });
        if (!existing) {
          throw new Error('Payment record not found');
        }
        if (existing.status !== 'PENDING' && existing.status !== 'PENDING_VERIFICATION' && existing.status !== 'VERIFICATION') {
          throw new Error(`Payment has already been processed with status '${existing.status}'`);
        }

        const updated = await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'APPROVED' }
        });

        // Synchronize all open/unpaid invoices for this tenant
        const openInvoices = await tx.invoice.findMany({
          where: {
            OR: [
              { tenantId: existing.tenantId },
              ...(existing.invoiceId ? [{ id: existing.invoiceId }] : [])
            ]
          }
        });

        if (openInvoices.length > 0) {
          for (const inv of openInvoices) {
            const newPaid = Math.min(inv.amount, (inv.paidAmount || 0) + existing.amount);
            const dueDateStr = inv.dueDate ? inv.dueDate.toISOString() : new Date().toISOString();
            const newStatus = calculateBillStatus(inv.amount, newPaid, dueDateStr, false, new Date());
            await tx.invoice.update({
              where: { id: inv.id },
              data: {
                paidAmount: newPaid,
                status: newStatus
              }
            });
          }
        }
        return updated;
      });
    } catch (e: any) {
      logDebug('approvePayment DB fallback:', e);
      if (e.message?.includes('already been processed')) throw e;
    }

    const target = mockPayments.find(p => p.id === paymentId);
    if (target) {
      const currentStatus = target.status as string;
      if (currentStatus !== 'PENDING' && currentStatus !== 'PENDING_VERIFICATION' && currentStatus !== 'VERIFICATION') {
        throw new Error(`Payment has already been processed with status '${target.status}'`);
      }
      target.status = 'APPROVED';

      // Update target invoice if present
      const inv = mockInvoices.find(i => i.id === target.invoiceId || i.tenantId === target.tenantId);
      if (inv) {
        inv.paidAmount = Math.min(inv.amount, (inv.paidAmount || 0) + target.amount);
        const calcSt = calculateBillStatus(inv.amount, inv.paidAmount, inv.dueDate || new Date().toISOString(), false, new Date());
        inv.status = (calcSt === 'DUE' ? 'PENDING' : calcSt) as any;
      }

      // Audit log
      mockAuditLogs.unshift({
        id: `audit-${Date.now()}`,
        action: 'PAYMENT_VERIFIED',
        userName: approvedBy,
        entityId: paymentId,
        details: `Approved & verified payment of ₹${target.amount.toLocaleString()} for ${target.tenantName || 'Resident'} (UTR: ${target.referenceId || 'N/A'})`,
        createdAt: new Date().toISOString()
      });

      saveDevStore({ payments: mockPayments, invoices: mockInvoices });
    }
    return target || { id: paymentId, status: 'APPROVED' };
  },

  async rejectPayment(paymentId: string, rejectionReason: string = 'Payment verification failed', rejectedBy: string = 'Manager') {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.payment.findUnique({
          where: { id: paymentId }
        });
        if (!existing) {
          throw new Error('Payment record not found');
        }
        if (existing.status !== 'PENDING' && existing.status !== 'PENDING_VERIFICATION' && existing.status !== 'VERIFICATION') {
          throw new Error(`Payment has already been processed with status '${existing.status}'`);
        }

        const updated = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason || 'Payment verification failed'
          }
        });
        return updated;
      });
    } catch (e: any) {
      logDebug('rejectPayment DB fallback:', e);
      if (e.message?.includes('already been processed')) throw e;
    }

    const target = mockPayments.find(p => p.id === paymentId);
    if (target) {
      target.status = 'REJECTED';
      target.rejectionReason = rejectionReason || 'Payment verification failed';

      // Audit log
      mockAuditLogs.unshift({
        id: `audit-${Date.now()}`,
        action: 'PAYMENT_REJECTED',
        userName: rejectedBy,
        entityId: paymentId,
        details: `Rejected payment submission of ₹${target.amount.toLocaleString()} for ${target.tenantName || 'Resident'}. Reason: ${rejectionReason}`,
        createdAt: new Date().toISOString()
      });
    }
    return target || { id: paymentId, status: 'REJECTED', rejectionReason };
  },

  async updateInvoiceStatus(
    invoiceId: string,
    targetStatus: 'PAID' | 'OVERDUE' | 'DUE' | 'PENDING' | 'PARTIAL',
    updatedBy: string = 'Owner',
    tenantId?: string
  ) {
    const normStatus = (targetStatus === 'PENDING' ? 'DUE' : targetStatus) as any;
    
    try {
      await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.findFirst({
          where: {
            OR: [
              { id: invoiceId },
              ...(tenantId ? [{ tenantId }] : [])
            ]
          }
        });
        if (inv) {
          let newPaid = inv.paidAmount;
          if (normStatus === 'PAID') {
            newPaid = inv.amount;
          } else if (normStatus === 'DUE') {
            newPaid = 0;
          }
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              status: normStatus,
              paidAmount: newPaid
            }
          });
          if (normStatus === 'PAID') {
            const outstanding = Math.max(0, inv.amount - (inv.paidAmount || 0));
            if (outstanding > 0) {
              await tx.payment.create({
                data: {
                  tenantId: inv.tenantId,
                  invoiceId: inv.id,
                  amount: outstanding,
                  paymentMethod: 'STATUS_OVERRIDE',
                  type: 'Monthly Rent',
                  status: 'PAID',
                  notes: `Status updated to PAID by ${updatedBy}`
                }
              });
            }
          }
        }
      });
    } catch (e) {
      logDebug('updateInvoiceStatus DB fallback:', e);
    }

    const invMock = mockInvoices.find(i => i.id === invoiceId || (tenantId && i.tenantId === tenantId));
    if (invMock) {
      invMock.status = normStatus;
      if (normStatus === 'PAID') {
        invMock.paidAmount = invMock.amount;
      } else if (normStatus === 'DUE') {
        invMock.paidAmount = 0;
      }
    }

    mockAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'INVOICE_STATUS_CHANGED',
      userName: updatedBy,
      entityId: invoiceId,
      details: `Payment status changed to ${normStatus} by ${updatedBy}`,
      createdAt: new Date().toISOString()
    });

    saveDevStore({ invoices: mockInvoices });
    return { success: true, status: normStatus };
  },

  async reverseTransaction(data: { paymentId: string; reason: string; reversedBy?: string; reversalAmount?: number }) {
    const { paymentId, reason, reversedBy = 'Manager', reversalAmount } = data;
    
    // Find target payment
    const targetPayment = mockPayments.find(p => p.id === paymentId);
    if (!targetPayment) {
      throw new Error(`Transaction with ID '${paymentId}' not found.`);
    }

    const refundAmount = reversalAmount !== undefined ? reversalAmount : targetPayment.amount;
    const reversalId = `rev-${Date.now()}`;
    const reversalRecord: any = {
      id: reversalId,
      tenantId: targetPayment.tenantId,
      tenantName: targetPayment.tenantName,
      invoiceId: targetPayment.invoiceId,
      amount: -refundAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'Reversal / Refund',
      paymentMethod: targetPayment.paymentMethod,
      status: 'REFUNDED',
      referenceId: `REFUND-${targetPayment.referenceId || Date.now().toString().slice(-6)}`,
      notes: `Reversal for ${targetPayment.id}: ${reason}`,
      recordedBy: reversedBy,
      originalPaymentId: targetPayment.id,
      receiptNumber: `SSR-REF-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };

    targetPayment.status = 'REFUNDED';
    mockPayments.unshift(reversalRecord);

    // Adjust target invoice
    if (targetPayment.invoiceId) {
      const inv = mockInvoices.find(i => i.id === targetPayment.invoiceId);
      if (inv) {
        inv.paidAmount = Math.max(0, (inv.paidAmount || 0) - refundAmount);
        inv.status = inv.paidAmount >= inv.amount ? 'PAID' : (inv.paidAmount > 0 ? 'PARTIAL' : 'PENDING');
      }
    }

    // Audit log
    mockAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'TRANSACTION_REVERSED',
      userName: reversedBy,
      entityId: reversalId,
      details: `Reversed ₹${refundAmount.toLocaleString()} from transaction ${targetPayment.id} (${targetPayment.tenantName}). Reason: ${reason}`,
      createdAt: new Date().toISOString()
    });

    return { success: true, reversal: reversalRecord };
  },

  async sendPaymentReminder(data: {
    invoiceId: string;
    reminderType: 'Upcoming Due' | 'Due Today' | 'Overdue' | 'Manual Reminder';
    channel: 'WhatsApp' | 'SMS' | 'Portal' | 'Email';
    sentBy?: string;
  }) {
    const { invoiceId, reminderType, channel, sentBy = 'Manager' } = data;

    // Find bill
    const inv = mockInvoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found.');

    const tenant = mockTenants.find(t => t.id === inv.tenantId || t.name === inv.tenantName);
    const tenantName = tenant ? tenant.name : inv.tenantName;
    const outstanding = Math.max(0, inv.amount - (inv.paidAmount || 0));

    // Hard rule: Reminders MUST stop after payment
    if (outstanding <= 0 || inv.status === 'PAID') {
      throw new Error(`Cannot send reminder: This bill is already fully paid (Outstanding: ₹0).`);
    }

    // Event deduplication: check if this specific reminder event type was already sent for this invoice
    const existing = mockReminders.find(r => r.invoiceId === invoiceId && r.type === reminderType);
    if (existing) {
      return {
        alreadySent: true,
        sentAt: existing.sentAt,
        message: `A '${reminderType}' reminder was already sent on ${new Date(existing.sentAt).toLocaleString('en-IN')}.`,
        reminder: existing
      };
    }

    const reminderId = `rem-${Date.now()}`;
    const newReminder: any = {
      id: reminderId,
      invoiceId,
      tenantId: inv.tenantId,
      type: reminderType,
      channel,
      sentAt: new Date().toISOString(),
      sentBy,
      status: 'SENT'
    };

    mockReminders.unshift(newReminder);

    // Audit log
    mockAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'REMINDER_SENT',
      userName: sentBy,
      entityId: reminderId,
      details: `Sent '${reminderType}' reminder via ${channel} to ${tenantName} for ${inv.billingMonth || 'Rent'} (Outstanding: ₹${outstanding.toLocaleString()})`,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      alreadySent: false,
      message: `Reminder sent successfully to ${tenantName} via ${channel}.`,
      reminder: newReminder
    };
  },


  // --- QR PAYMENT SETTINGS ---
  async getQRPaymentSettings() {
    try {
      const settings = await prisma.setting.findMany({
        where: { key: { in: ['qr_code_url', 'upi_id', 'payment_instructions'] } }
      });
      const qrMap: Record<string, string> = {};
      (settings || []).forEach(s => {
        qrMap[s.key] = s.value;
      });
      return {
        qrCodeUrl: qrMap['qr_code_url'] || '',
        upiId: qrMap['upi_id'] || '',
        instructions: qrMap['payment_instructions'] || ''
      };
    } catch (e) {
      logDebug('getQRPaymentSettings DB error:', e);
      return {
        qrCodeUrl: mockQRSettings.qrCodeUrl || '',
        upiId: mockQRSettings.upiId || '',
        instructions: mockQRSettings.instructions || ''
      };
    }
  },

  async saveQRPaymentSettings(data: { qrCodeUrl?: string; upiId?: string; instructions?: string }) {
    try {
      if (data.qrCodeUrl !== undefined) {
        await prisma.setting.upsert({
          where: { key: 'qr_code_url' },
          update: { value: data.qrCodeUrl },
          create: { id: 'setting-qr-url', key: 'qr_code_url', value: data.qrCodeUrl }
        });
        mockQRSettings.qrCodeUrl = data.qrCodeUrl;
      }
      if (data.upiId !== undefined) {
        await prisma.setting.upsert({
          where: { key: 'upi_id' },
          update: { value: data.upiId },
          create: { id: 'setting-upi-id', key: 'upi_id', value: data.upiId }
        });
        mockQRSettings.upiId = data.upiId;
      }
      if (data.instructions !== undefined) {
        await prisma.setting.upsert({
          where: { key: 'payment_instructions' },
          update: { value: data.instructions },
          create: { id: 'setting-instructions', key: 'payment_instructions', value: data.instructions }
        });
        mockQRSettings.instructions = data.instructions;
      }
      return this.getQRPaymentSettings();
    } catch (e) {
      logDebug('saveQRPaymentSettings DB fallback:', e);
    }
    if (data.qrCodeUrl !== undefined) mockQRSettings.qrCodeUrl = data.qrCodeUrl;
    if (data.upiId !== undefined) mockQRSettings.upiId = data.upiId;
    if (data.instructions !== undefined) mockQRSettings.instructions = data.instructions;
    return mockQRSettings;
  },

  // --- PERSISTENT NOTIFICATIONS ---
  async getReadNotificationIds(userId: string) {
    try {
      const readRecords = await prisma.notificationRead.findMany({
        where: { userId }
      });
      if (readRecords) {
        return readRecords.map(r => r.notificationId);
      }
    } catch (e) {
      logDebug('getReadNotificationIds DB fallback:', e);
    }
    return Array.from(mockNotificationReads);
  },

  async markNotificationAsRead(userId: string, notificationId: string) {
    try {
      await prisma.notificationRead.upsert({
        where: {
          userId_notificationId: { userId, notificationId }
        },
        update: {},
        create: {
          userId,
          notificationId
        }
      });
    } catch (e) {
      logDebug('markNotificationAsRead DB fallback:', e);
    }
    mockNotificationReads.add(notificationId);
    return true;
  },

  // --- OWNER PROFILE NAME PERSISTENCE ---
  async updateOwnerProfile(userId: string, data: { name?: string; phone?: string }) {
    let firstName = 'Alok';
    let lastName = 'Sharma';
    if (data.name) {
      const parts = data.name.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    try {
      const existingProfile = await prisma.profile.findFirst({ where: { userId } });
      if (existingProfile) {
        await prisma.profile.update({
          where: { id: existingProfile.id },
          data: {
            ...(data.name ? { firstName, lastName } : {}),
            ...(data.phone ? { phone: data.phone } : {})
          }
        });
      } else {
        await prisma.profile.create({
          data: {
            userId,
            firstName,
            lastName,
            phone: data.phone || '+91 98765 43210',
            status: 'ACTIVE'
          }
        });
      }
    } catch (e) {
      logDebug('updateOwnerProfile DB fallback:', e);
    }

    const mockOwner = mockUsers.find(u => u.id === userId || u.email === 'owner@srisaisiri.com');
    if (mockOwner && data.name) {
      mockOwner.name = data.name;
    }
    return { userId, name: data.name, phone: data.phone };
  },

  // --- AUTO-GENERATE MONTHLY INVOICES & NOTIFICATIONS ---
  async autoGenerateMonthlyInvoices(billingMonth: string = 'September 2026') {
    const tenants = await this.getTenants();
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE' || !t.status);
    const existingInvoices = await this.getInvoices();
    const createdInvoices: any[] = [];

    const now = new Date();
    const dueDateStr = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0];

    for (const tenant of activeTenants) {
      const alreadyHasInvoice = existingInvoices.some((inv: any) => 
        (inv.tenantId === tenant.id || inv.tenantName === tenant.name) &&
        (inv.billingMonth === billingMonth || (inv.itemsJson && inv.itemsJson.includes(billingMonth)))
      );

      if (!alreadyHasInvoice) {
        try {
          const inv = await this.createInvoice(
            tenant.id,
            tenant.rentAmount || 8500,
            [{ description: `Hostel Room Rent (${billingMonth})`, amount: tenant.rentAmount || 8500 }],
            dueDateStr
          );
          createdInvoices.push(inv);
        } catch (e) {
          logDebug(`autoGenerateMonthlyInvoices error for ${tenant.name}:`, e);
          const fallbackInv = {
            id: `inv-auto-${Date.now()}-${tenant.id}`,
            number: `INV-2026-${String(Date.now()).slice(-4)}`,
            tenantId: tenant.id,
            tenantName: tenant.name,
            roomNumber: tenant.roomNumber || 'A-101',
            amount: tenant.rentAmount || 8500,
            paidAmount: 0,
            dueDate: dueDateStr,
            billingMonth,
            status: 'PENDING' as const,
            items: [{ description: `Hostel Room Rent (${billingMonth})`, amount: tenant.rentAmount || 8500 }],
            dateCreated: new Date().toISOString().split('T')[0]
          };
          mockInvoices.unshift(fallbackInv);
          createdInvoices.push(fallbackInv);
        }
      }
    }

    // Create Warden Notice broadcast alerting residents about generated invoices
    if (createdInvoices.length > 0) {
      try {
        await prisma.notice.create({
          data: {
            title: `Rent Invoice Dues Notice (${billingMonth})`,
            content: `Monthly rent dues invoices for ${billingMonth} have been generated. Please clear your rent dues on or before 5th ${billingMonth.split(' ')[0]}.`,
            target: 'TENANTS',
            isEmergency: false,
            scheduleDate: new Date()
          }
        });
      } catch (e) {
        logDebug('autoGenerateNotice DB fallback:', e);
      }
    }

    return {
      success: true,
      billingMonth,
      count: createdInvoices.length,
      invoices: createdInvoices
    };
  },

  async getGuidelines() {
    try {
      const guidelines = await prisma.guideline.findMany({
        orderBy: { order: 'asc' }
      });
      return (guidelines || []).map(g => ({
        id: g.id,
        title: g.title,
        content: g.content,
        category: g.category || undefined,
        icon: g.icon || undefined,
        order: g.order,
        isActive: g.isActive,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString()
      }));
    } catch (e) {
      logDebug('getGuidelines DB error:', e);
      return [];
    }
  },

  async createGuideline(data: { title: string; content: string; category?: string; icon?: string; order?: number; isActive?: boolean }) {
    try {
      const created = await prisma.guideline.create({
        data: {
          title: data.title,
          content: data.content,
          category: data.category || null,
          icon: data.icon || null,
          order: data.order !== undefined ? data.order : 0,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });
      return {
        id: created.id,
        title: created.title,
        content: created.content,
        category: created.category || undefined,
        icon: created.icon || undefined,
        order: created.order,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      };
    } catch (e) {
      logDebug('createGuideline DB fallback:', e);
      const newGuide: any = {
        id: `guide-${Date.now()}`,
        title: data.title,
        content: data.content,
        category: data.category,
        icon: data.icon,
        order: data.order !== undefined ? data.order : mockGuidelines.length + 1,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockGuidelines.push(newGuide);
      return newGuide;
    }
  },

  async updateGuideline(id: string, data: { title?: string; content?: string; category?: string; icon?: string; order?: number; isActive?: boolean }) {
    try {
      const updated = await prisma.guideline.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.order !== undefined ? { order: data.order } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
        }
      });
      return {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        category: updated.category || undefined,
        icon: updated.icon || undefined,
        order: updated.order,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      };
    } catch (e) {
      logDebug('updateGuideline DB fallback:', e);
      const mockG = mockGuidelines.find(g => g.id === id);
      if (mockG) {
        if (data.title !== undefined) mockG.title = data.title;
        if (data.content !== undefined) mockG.content = data.content;
        if (data.category !== undefined) mockG.category = data.category;
        if (data.icon !== undefined) mockG.icon = data.icon;
        if (data.order !== undefined) mockG.order = data.order;
        if (data.isActive !== undefined) mockG.isActive = data.isActive;
        mockG.updatedAt = new Date().toISOString();
        return mockG;
      }
      return { id, ...data };
    }
  },

  async deleteGuideline(id: string) {
    try {
      await prisma.guideline.delete({ where: { id } });
      return true;
    } catch (e) {
      logDebug('deleteGuideline DB fallback:', e);
      const idx = mockGuidelines.findIndex(g => g.id === id);
      if (idx !== -1) mockGuidelines.splice(idx, 1);
      return true;
    }
  },

  async deleteQRPaymentSettings() {
    try {
      await prisma.setting.deleteMany({
        where: { key: { in: ['qr_code_url'] } }
      });
      mockQRSettings.qrCodeUrl = '';
      return this.getQRPaymentSettings();
    } catch (e) {
      logDebug('deleteQRPaymentSettings DB fallback:', e);
      mockQRSettings.qrCodeUrl = '';
      return mockQRSettings;
    }
  },

  // --- SHORT-STAY GUEST MANAGEMENT ---
  async getShortStayGuests() {
    try {
      const guests = await prisma.shortStayGuest.findMany({
        include: {
          payments: { orderBy: { paymentDate: 'desc' } },
          receipts: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' }
      });
      if (guests && guests.length > 0) return guests;
    } catch (e) {
      logDebug("getShortStayGuests fallback:", e);
    }
    const diskGuests = loadDevStore().shortStayGuests;
    if (Array.isArray(diskGuests)) {
      return diskGuests;
    }
    return globalForPrisma.shortStayGuests || [];
  },

  async getShortStayGuestById(id: string) {
    try {
      const guest = await prisma.shortStayGuest.findUnique({
        where: { id },
        include: {
          payments: { orderBy: { paymentDate: 'desc' } },
          receipts: { orderBy: { createdAt: 'desc' } }
        }
      });
      if (guest) return guest;
    } catch (e) {
      logDebug("getShortStayGuestById fallback:", e);
    }
    const storeGuests = loadDevStore().shortStayGuests;
    const list = (Array.isArray(storeGuests) && storeGuests.length > 0) ? storeGuests : (globalForPrisma.shortStayGuests || []);
    return list.find((g: any) => g.id === id) || null;
  },

  async createShortStayGuest(data: {
    name: string;
    phone: string;
    buildingId?: string;
    buildingName?: string;
    roomId?: string;
    roomNumber?: string;
    bedId?: string;
    bedNumber?: string;
    checkInDate: Date | string;
    checkInTime?: string;
    expectedCheckOutDate: Date | string;
    expectedCheckOutTime?: string;
    numberOfDays: number;
    dailyRent: number;
    amountPaid: number;
    paymentMethod: string;
    receivedBy?: string;
    notes?: string;
  }) {
    const totalAmount = Number((data.numberOfDays * data.dailyRent).toFixed(2));
    const amountPaid = Math.max(0, Math.min(totalAmount, Number((data.amountPaid || 0).toFixed(2))));
    const balance = Math.max(0, Number((totalAmount - amountPaid).toFixed(2)));
    
    let paymentStatus = 'PENDING';
    if (balance <= 0.01) {
      paymentStatus = 'PAID';
    } else if (amountPaid > 0 && balance > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const guestId = `ssg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const receiptNo = `SS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    try {
      const createdGuest = await prisma.shortStayGuest.create({
        data: {
          id: guestId,
          name: data.name,
          phone: data.phone,
          buildingId: data.buildingId,
          buildingName: data.buildingName,
          roomId: data.roomId,
          roomNumber: data.roomNumber,
          bedId: data.bedId,
          bedNumber: data.bedNumber,
          checkInDate: new Date(data.checkInDate),
          checkInTime: data.checkInTime || '12:00 PM',
          expectedCheckOutDate: new Date(data.expectedCheckOutDate),
          expectedCheckOutTime: data.expectedCheckOutTime || '11:00 AM',
          numberOfDays: data.numberOfDays,
          dailyRent: data.dailyRent,
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          balance: balance,
          paymentStatus: paymentStatus,
          status: 'ACTIVE',
          notes: data.notes
        }
      });

      if (data.bedId) {
        await prisma.bed.update({
          where: { id: data.bedId },
          data: {
            shortStayGuestId: createdGuest.id,
            isAvailable: false
          }
        });
      }

      if (amountPaid > 0) {
        const payment = await prisma.shortStayPayment.create({
          data: {
            guestId: createdGuest.id,
            amount: amountPaid,
            paymentMethod: data.paymentMethod || 'CASH',
            receiptNumber: receiptNo,
            receivedBy: data.receivedBy || 'Hostel Owner',
            status: 'PAID',
            notes: 'Initial payment upon registration'
          }
        });

        await prisma.shortStayReceipt.create({
          data: {
            receiptNumber: receiptNo,
            guestId: createdGuest.id,
            paymentId: payment.id,
            amountPaid: amountPaid,
            totalAmount: totalAmount,
            remainingBalance: balance,
            paymentMethod: data.paymentMethod || 'CASH',
            statusStamp: paymentStatus,
            receivedBy: data.receivedBy || 'Hostel Owner'
          }
        });
      }

      return await this.getShortStayGuestById(createdGuest.id);
    } catch (e) {
      logDebug("createShortStayGuest DB fallback:", e);
      const newGuest = {
        id: guestId,
        name: data.name,
        phone: data.phone,
        buildingId: data.buildingId,
        buildingName: data.buildingName,
        roomId: data.roomId,
        roomNumber: data.roomNumber,
        bedId: data.bedId,
        bedNumber: data.bedNumber,
        checkInDate: new Date(data.checkInDate),
        checkInTime: data.checkInTime || '12:00 PM',
        expectedCheckOutDate: new Date(data.expectedCheckOutDate),
        expectedCheckOutTime: data.expectedCheckOutTime || '11:00 AM',
        numberOfDays: data.numberOfDays,
        dailyRent: data.dailyRent,
        totalAmount: totalAmount,
        amountPaid: amountPaid,
        balance: balance,
        paymentStatus: paymentStatus,
        status: 'ACTIVE',
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: amountPaid > 0 ? [{
          id: `ssp-${Date.now()}`,
          guestId: guestId,
          amount: amountPaid,
          paymentMethod: data.paymentMethod || 'CASH',
          paymentDate: new Date(),
          receiptNumber: receiptNo,
          receivedBy: data.receivedBy || 'Hostel Owner',
          status: 'PAID',
          notes: 'Initial payment upon registration'
        }] : [],
        receipts: amountPaid > 0 ? [{
          id: `ssr-${Date.now()}`,
          receiptNumber: receiptNo,
          guestId: guestId,
          paymentId: `ssp-${Date.now()}`,
          amountPaid: amountPaid,
          totalAmount: totalAmount,
          remainingBalance: balance,
          paymentMethod: data.paymentMethod || 'CASH',
          paymentDate: new Date(),
          statusStamp: paymentStatus,
          receivedBy: data.receivedBy || 'Hostel Owner'
        }] : []
      };

      if (!globalForPrisma.shortStayGuests) {
        globalForPrisma.shortStayGuests = [];
      }
      globalForPrisma.shortStayGuests.unshift(newGuest);
      saveDevStore({ shortStayGuests: globalForPrisma.shortStayGuests });
      return newGuest;
    }
  },

  async addShortStayPayment(guestIdOrData: any, dataArg?: any) {
    const guestId = typeof guestIdOrData === 'string' ? guestIdOrData : (guestIdOrData?.guestId || '');
    const data = typeof guestIdOrData === 'string' ? dataArg : (guestIdOrData || {});
    const guest = await this.getShortStayGuestById(guestId);
    if (!guest) throw new Error("Short-stay guest not found.");

    const cleanTotal = Number((Number(guest.totalAmount) || 0).toFixed(2));
    const newAmountPaid = Number(((Number(guest.amountPaid) || 0) + (Number(data.amount) || 0)).toFixed(2));
    const newBalance = Math.max(0, Number((cleanTotal - newAmountPaid).toFixed(2)));
    
    let paymentStatus = 'PENDING';
    if (newBalance <= 0.01) {
      paymentStatus = 'PAID';
    } else if (newAmountPaid > 0 && newBalance > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const receiptNo = `SS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    try {
      await prisma.shortStayGuest.update({
        where: { id: guestId },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          paymentStatus: paymentStatus
        }
      });

      const payment = await prisma.shortStayPayment.create({
        data: {
          guestId: guestId,
          amount: data.amount,
          paymentMethod: data.paymentMethod || 'CASH',
          receiptNumber: receiptNo,
          receivedBy: data.receivedBy || 'Hostel Owner',
          status: 'PAID',
          notes: data.notes || 'Installment payment'
        }
      });

      await prisma.shortStayReceipt.create({
        data: {
          receiptNumber: receiptNo,
          guestId: guestId,
          paymentId: payment.id,
          amountPaid: data.amount,
          totalAmount: guest.totalAmount,
          remainingBalance: newBalance,
          paymentMethod: data.paymentMethod || 'CASH',
          statusStamp: paymentStatus,
          receivedBy: data.receivedBy || 'Hostel Owner'
        }
      });

      return payment;
    } catch (e) {
      logDebug("addShortStayPayment DB fallback:", e);
      if (!globalForPrisma.shortStayGuests || globalForPrisma.shortStayGuests.length === 0) {
        globalForPrisma.shortStayGuests = loadDevStore().shortStayGuests || [];
      }
      const match = globalForPrisma.shortStayGuests.find((g: any) => g.id === guestId) || guest;
      match.amountPaid = newAmountPaid;
      match.balance = newBalance;
      match.paymentStatus = paymentStatus;

      const pId = `ssp-${Date.now()}`;
      const newPayment = {
        id: pId,
        guestId,
        amount: data.amount,
        paymentMethod: data.paymentMethod || 'CASH',
        paymentDate: new Date(),
        receiptNumber: receiptNo,
        receivedBy: data.receivedBy || 'Hostel Owner',
        status: 'PAID',
        notes: data.notes || 'Installment payment'
      };

      const newReceipt = {
        id: `ssr-${Date.now()}`,
        receiptNumber: receiptNo,
        guestId,
        paymentId: pId,
        amountPaid: data.amount,
        totalAmount: match.totalAmount,
        remainingBalance: newBalance,
        paymentMethod: data.paymentMethod || 'CASH',
        paymentDate: new Date(),
        statusStamp: paymentStatus,
        receivedBy: data.receivedBy || 'Hostel Owner'
      };

      if (!match.payments) match.payments = [];
      if (!match.receipts) match.receipts = [];
      match.payments.unshift(newPayment);
      match.receipts.unshift(newReceipt);
      saveDevStore({ shortStayGuests: globalForPrisma.shortStayGuests });

      return newPayment;
    }
  },

  async checkoutShortStayGuest(guestId: string) {
    const guest = await this.getShortStayGuestById(guestId);
    if (!guest) throw new Error("Short-stay guest not found.");

    const now = new Date();
    try {
      await prisma.shortStayGuest.update({
        where: { id: guestId },
        data: {
          status: 'CHECKED_OUT',
          actualCheckOutDate: now
        }
      });

      if (guest.bedId) {
        await prisma.bed.update({
          where: { id: guest.bedId },
          data: {
            shortStayGuestId: null,
            isAvailable: true
          }
        });
      }

      return await this.getShortStayGuestById(guestId);
    } catch (e) {
      logDebug("checkoutShortStayGuest DB fallback:", e);
      if (!globalForPrisma.shortStayGuests || globalForPrisma.shortStayGuests.length === 0) {
        globalForPrisma.shortStayGuests = loadDevStore().shortStayGuests || [];
      }
      const match = globalForPrisma.shortStayGuests.find((g: any) => g.id === guestId) || guest;
      match.status = 'CHECKED_OUT';
      match.actualCheckOutDate = now;
      saveDevStore({ shortStayGuests: globalForPrisma.shortStayGuests });
      return match;
    }
  },

  async getShortStayStats() {
    const guests = await this.getShortStayGuests();
    const todayStr = new Date().toISOString().split('T')[0];

    const currentlyStaying = guests.filter(g => g.status === 'ACTIVE').length;
    const checkingOutToday = guests.filter(g => {
      if (g.status !== 'ACTIVE') return false;
      const expectedDateStr = new Date(g.expectedCheckOutDate).toISOString().split('T')[0];
      return expectedDateStr === todayStr;
    }).length;

    const upcomingGuests = guests.filter(g => {
      const checkInDateStr = new Date(g.checkInDate).toISOString().split('T')[0];
      return checkInDateStr > todayStr && g.status === 'ACTIVE';
    }).length;

    const partiallyPaid = guests.filter(g => g.status === 'ACTIVE' && g.paymentStatus === 'PARTIALLY_PAID').length;
    const pendingPayments = guests.filter(g => g.status === 'ACTIVE' && g.paymentStatus === 'PENDING').length;
    
    const totalRevenue = guests.reduce((sum, g) => sum + (g.amountPaid || 0), 0);
    const outstandingBalance = guests
      .filter(g => g.status === 'ACTIVE')
      .reduce((sum, g) => sum + (g.balance || 0), 0);

    return {
      currentlyStaying,
      checkingOutToday,
      upcomingGuests,
      partiallyPaid,
      pendingPayments,
      totalRevenue,
      outstandingBalance
    };
  }
};

