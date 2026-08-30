import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const detail = url.searchParams.get('detail');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ON-DEMAND DETAILED FETCHING
    if (detail === 'occupancy' || detail === 'property') {
      const buildings = await prisma.building.findMany({
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
      });
      return NextResponse.json({ success: true, buildings }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'tenants') {
      const tenants = await prisma.tenant.findMany({
        include: { profile: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, tenants }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'financial') {
      const [payments, invoices, expenses] = await Promise.all([
        prisma.payment.findMany({
          orderBy: { date: 'desc' },
          take: 50,
          include: { tenant: { include: { profile: true } } }
        }),
        prisma.invoice.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { tenant: { include: { profile: true } } }
        }),
        prisma.expense.findMany({
          orderBy: { date: 'desc' },
          take: 50
        })
      ]);
      return NextResponse.json({ success: true, payments, invoices, expenses }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'issues') {
      const [complaints, maintenance] = await Promise.all([
        prisma.complaint.findMany({
          orderBy: { createdAt: 'desc' },
          include: { tenant: { include: { profile: true } } }
        }),
        prisma.maintenance.findMany({
          orderBy: { createdAt: 'desc' },
          include: { room: true }
        })
      ]);
      return NextResponse.json({ success: true, complaints, maintenance }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'staff') {
      const [employees, leaveRequests] = await Promise.all([
        prisma.employee.findMany({
          include: { salaries: true, attendance: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.leaveRequest.findMany({
          include: { tenant: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ]);
      return NextResponse.json({ success: true, employees, leaveRequests }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'visitors') {
      const visitors = await prisma.visitor.findMany({
        orderBy: { createdAt: 'desc' },
        include: { tenant: { include: { profile: true } } }
      });
      return NextResponse.json({ success: true, visitors }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    if (detail === 'inventory') {
      const items = await prisma.inventory.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, items }, {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      });
    }

    // DEFAULT SUMMARY FAST OVERVIEW FETCH (<15ms)
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
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', date: { gte: startOfMonth } }
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        select: { amount: true, paidAmount: true }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startOfMonth } }
      }),
      prisma.complaint.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.maintenance.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.maintenance.count({ where: { status: 'COMPLETED' } }),
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.visitor.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.visitor.count({ where: { approvalStatus: 'APPROVED', checkOut: null } }),
      prisma.inventory.count(),
      prisma.inventory.count({ where: { condition: { in: ['POOR', 'REPLACEMENT_REQUIRED'] } } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const availableBedsCount = Math.max(0, bedsCount - occupiedBedsCount);
    const occupancyRate = bedsCount > 0 ? Math.round((occupiedBedsCount / bedsCount) * 100) : 0;
    const monthlyCollection = paidPaymentsAggregate._sum.amount || 0;
    const monthlyExpenses = expensesAggregate._sum.amount || 0;

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
    console.error('Reports API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
