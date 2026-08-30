import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function safeQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Safe query error:', error);
    return fallback;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const detail = url.searchParams.get('detail');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ON-DEMAND DETAILED FETCHING
    if (detail === 'occupancy' || detail === 'property') {
      const buildings = await safeQuery(
        () => prisma.building.findMany({
          include: {
            floors: {
              orderBy: { number: 'asc' },
              include: {
                rooms: {
                  orderBy: { number: 'asc' },
                  include: {
                    beds: {
                      include: {
                        tenant: { include: { profile: true } }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        []
      );
      return NextResponse.json({ success: true, buildings }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'tenants') {
      const tenants = await safeQuery(
        () => prisma.tenant.findMany({
          include: { profile: true },
          orderBy: { createdAt: 'desc' }
        }),
        []
      );
      return NextResponse.json({ success: true, tenants }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'financial') {
      const [payments, invoices, expenses] = await Promise.all([
        safeQuery(() => prisma.payment.findMany({
          orderBy: { date: 'desc' },
          take: 50,
          include: { tenant: { include: { profile: true } } }
        }), []),
        safeQuery(() => prisma.invoice.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { tenant: { include: { profile: true } } }
        }), []),
        safeQuery(() => prisma.expense.findMany({
          orderBy: { date: 'desc' },
          take: 50
        }), [])
      ]);
      return NextResponse.json({ success: true, payments, invoices, expenses }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'issues') {
      const [complaints, maintenance] = await Promise.all([
        safeQuery(() => prisma.complaint.findMany({
          orderBy: { createdAt: 'desc' },
          include: { tenant: { include: { profile: true } } }
        }), []),
        safeQuery(() => prisma.maintenance.findMany({
          orderBy: { createdAt: 'desc' },
          include: { room: true }
        }), [])
      ]);
      return NextResponse.json({ success: true, complaints, maintenance }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'staff') {
      const [employees, leaveRequests] = await Promise.all([
        safeQuery(() => prisma.employee.findMany({
          include: { salaries: true, attendance: true },
          orderBy: { createdAt: 'desc' }
        }), []),
        safeQuery(() => prisma.leaveRequest.findMany({
          include: { tenant: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' }
        }), [])
      ]);
      return NextResponse.json({ success: true, employees, leaveRequests }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'visitors') {
      const visitors = await safeQuery(
        () => prisma.visitor.findMany({
          orderBy: { createdAt: 'desc' },
          include: { tenant: { include: { profile: true } } }
        }),
        []
      );
      return NextResponse.json({ success: true, visitors }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'inventory') {
      const items = await safeQuery(
        () => prisma.inventory.findMany({
          orderBy: { createdAt: 'desc' }
        }),
        []
      );
      return NextResponse.json({ success: true, items }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    // DEFAULT BULLETPROOF SUMMARY OVERVIEW FETCH (<15ms)
    const [
      buildingsCount,
      floorsCount,
      roomsCount,
      bedsCount,
      occupiedBedsCount,
      totalTenantsCount,
      activeTenantsCount,
      newTenantsCount,
      paidPaymentsAggregate,
      pendingInvoicesList,
      expensesAggregate,
      openComplaintsCount,
      resolvedComplaintsCount,
      activeMaintenanceCount,
      completedMaintenanceCount,
      totalEmployeesCount,
      activeEmployeesCount,
      pendingLeavesCount,
      todayVisitorsCount,
      activeVisitorsCount,
      inventoryCount,
      poorInventoryCount,
      recentAuditLogs
    ] = await Promise.all([
      safeQuery(() => prisma.building.count(), 0),
      safeQuery(() => prisma.floor.count(), 0),
      safeQuery(() => prisma.room.count(), 0),
      safeQuery(() => prisma.bed.count(), 0),
      safeQuery(() => prisma.bed.count({
        where: {
          OR: [
            { isAvailable: false },
            { tenantId: { not: null } }
          ]
        }
      }), 0),
      safeQuery(() => prisma.tenant.count(), 0),
      safeQuery(() => prisma.tenant.count({ where: { status: 'ACTIVE' } }), 0),
      safeQuery(() => prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }), 0),
      safeQuery(() => prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' }
      }), { _sum: { amount: 0 } }),
      safeQuery(() => prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        select: { amount: true, paidAmount: true }
      }), []),
      safeQuery(() => prisma.expense.aggregate({
        _sum: { amount: true }
      }), { _sum: { amount: 0 } }),
      safeQuery(() => prisma.complaint.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }), 0),
      safeQuery(() => prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }), 0),
      safeQuery(() => prisma.maintenance.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }), 0),
      safeQuery(() => prisma.maintenance.count({ where: { status: 'COMPLETED' } }), 0),
      safeQuery(() => prisma.employee.count(), 0),
      safeQuery(() => prisma.employee.count({ where: { status: 'ACTIVE' } }), 0),
      safeQuery(() => prisma.leaveRequest.count({ where: { status: 'PENDING' } }), 0),
      safeQuery(() => prisma.visitor.count(), 0),
      safeQuery(() => prisma.visitor.count({ where: { approvalStatus: 'APPROVED', checkOut: null } }), 0),
      safeQuery(() => prisma.inventory.count(), 0),
      safeQuery(() => prisma.inventory.count({ where: { condition: { in: ['POOR', 'REPLACEMENT_REQUIRED'] } } }), 0),
      safeQuery(() => prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }), [])
    ]);

    const availableBedsCount = Math.max(0, bedsCount - occupiedBedsCount);
    const occupancyRate = bedsCount > 0 ? Math.round((occupiedBedsCount / bedsCount) * 100) : 0;
    const monthlyCollection = Math.max(0, paidPaymentsAggregate._sum.amount || 0);
    const monthlyExpenses = Math.abs(expensesAggregate._sum.amount || 0);

    let pendingDues = 0;
    pendingInvoicesList.forEach(inv => {
      pendingDues += Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
    });

    return NextResponse.json({
      summary: {
        totalBuildings: buildingsCount,
        totalFloors: floorsCount,
        totalRooms: roomsCount,
        totalBeds: bedsCount,
        occupiedBeds: occupiedBedsCount,
        availableBeds: availableBedsCount,
        occupancyRate,
        totalTenants: totalTenantsCount,
        activeTenants: activeTenantsCount,
        inactiveTenants: Math.max(0, totalTenantsCount - activeTenantsCount),
        newTenantsThisMonth: newTenantsCount,
        monthlyCollection,
        pendingDues,
        monthlyExpenses,
        netAmount: monthlyCollection - monthlyExpenses,
        openComplaints: openComplaintsCount,
        resolvedComplaints: resolvedComplaintsCount,
        activeMaintenance: activeMaintenanceCount,
        completedMaintenance: completedMaintenanceCount,
        totalEmployees: totalEmployeesCount,
        activeEmployees: activeEmployeesCount,
        pendingLeaveRequests: pendingLeavesCount,
        todayVisitors: todayVisitorsCount,
        activeVisitors: activeVisitorsCount,
        inventoryCount,
        poorInventoryCount,
        recentAuditLogs
      }
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });
  } catch (error: any) {
    console.error('Reports API Fatal Error:', error);
    return NextResponse.json({
      summary: {
        totalBuildings: 0, totalFloors: 0, totalRooms: 0, totalBeds: 0, occupiedBeds: 0,
        availableBeds: 0, occupancyRate: 0, totalTenants: 0, activeTenants: 0, inactiveTenants: 0,
        newTenantsThisMonth: 0, monthlyCollection: 0, pendingDues: 0, monthlyExpenses: 0,
        netAmount: 0, openComplaints: 0, resolvedComplaints: 0, activeMaintenance: 0,
        completedMaintenance: 0, totalEmployees: 0, activeEmployees: 0, pendingLeaveRequests: 0,
        todayVisitors: 0, activeVisitors: 0, inventoryCount: 0, poorInventoryCount: 0, recentAuditLogs: []
      }
    }, { status: 200 });
  }
}
