import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [buildings, tenants, invoices, employees, complaints, expenses, inventory, notices] = await Promise.all([
      dbService.getBuildings(),
      dbService.getTenants(),
      dbService.getInvoices(),
      dbService.getEmployees(),
      dbService.getComplaints(),
      dbService.getExpenses(),
      dbService.getInventory(),
      dbService.getNotices()
    ]);

    // Metrics calculations
    const buildingsCount = buildings.length;
    let floorsCount = 0;
    let roomsCount = 0;
    let bedsCount = 0;
    let occupiedBedsCount = 0;
    let maintenanceRoomsCount = 0;

    buildings.forEach((b: any) => {
      floorsCount += b.floors?.length || 0;
      b.floors?.forEach((f: any) => {
        roomsCount += f.rooms?.length || 0;
        f.rooms?.forEach((r: any) => {
          if (r.status === 'MAINTENANCE') {
            maintenanceRoomsCount++;
          }
          bedsCount += r.beds?.length || 0;
          r.beds?.forEach((bed: any) => {
            if (!bed.isAvailable || bed.tenantId) {
              occupiedBedsCount++;
            }
          });
        });
      });
    });

    const vacantBedsCount = Math.max(0, bedsCount - occupiedBedsCount);
    const activeTenantsCount = tenants.filter((t: any) => t.status === 'ACTIVE' || !t.status).length;

    // Financial Metrics
    let monthlyIncome = 0;
    let pendingRent = 0;
    let overdueDues = 0;
    let monthlyExpenses = 0;

    const today = new Date();

    invoices.forEach((inv: any) => {
      const isOverdue = inv.status === 'OVERDUE' || (inv.status === 'PENDING' && inv.dueDate && new Date(inv.dueDate) < today);
      if (inv.status === 'PAID') {
        monthlyIncome += (Number(inv.amount) || 0);
      } else if (inv.status === 'PARTIAL') {
        monthlyIncome += (Number(inv.paidAmount) || 0);
        const rem = (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0);
        pendingRent += rem;
        if (isOverdue) overdueDues += rem;
      } else {
        const amt = (Number(inv.amount) || 0);
        pendingRent += amt;
        if (isOverdue) overdueDues += amt;
      }
    });

    expenses.forEach((exp: any) => {
      monthlyExpenses += (Number(exp.amount) || 0);
    });

    const netProfit = monthlyIncome - monthlyExpenses;
    const pendingSalaryDue = employees.reduce((sum: number, emp: any) => sum + (Number(emp.pendingSalary) || 0), 0);
    const pendingComplaintsCount = complaints.filter((c: any) => c.status === 'PENDING' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;

    // Dynamic Room Type Distribution from actual DB buildings
    const roomTypeCounts: Record<string, number> = {};
    buildings.forEach((b: any) => {
      b.floors?.forEach((f: any) => {
        f.rooms?.forEach((r: any) => {
          const typeName = r.type || 'Standard Room';
          roomTypeCounts[typeName] = (roomTypeCounts[typeName] || 0) + 1;
        });
      });
    });

    const roomTypeDistribution = Object.keys(roomTypeCounts).map(type => ({
      name: type,
      value: roomTypeCounts[type]
    }));

    // Dynamic Monthly Financial Breakdown from actual invoices & expenses
    const currentMonthName = new Date().toLocaleString('en-IN', { month: 'short' });
    const financialsChart = [
      { name: currentMonthName, income: monthlyIncome, expenses: monthlyExpenses, profit: Math.max(0, netProfit) }
    ];

    // Room Occupancy Chart
    const occupancyChart = [
      { name: 'Occupied Beds', value: occupiedBedsCount },
      { name: 'Vacant Beds', value: vacantBedsCount }
    ];

    return NextResponse.json({
      metrics: {
        buildings: buildingsCount,
        floors: floorsCount,
        rooms: roomsCount,
        occupiedRooms: buildings.reduce((sum, b) => sum + (b.floors?.reduce((fSum: number, f: any) => fSum + (f.rooms?.filter((r: any) => r.status === 'OCCUPIED').length || 0), 0) || 0), 0),
        vacantRooms: buildings.reduce((sum, b) => sum + (b.floors?.reduce((fSum: number, f: any) => fSum + (f.rooms?.filter((r: any) => r.status === 'AVAILABLE').length || 0), 0) || 0), 0),
        beds: bedsCount,
        occupiedBeds: occupiedBedsCount,
        vacantBeds: vacantBedsCount,
        tenants: activeTenantsCount,
        monthlyIncome,
        pendingRent,
        overdueDues,
        monthlyExpenses,
        netProfit,
        employeeSalaryDue: pendingSalaryDue,
        maintenanceRequests: pendingComplaintsCount + maintenanceRoomsCount,
        todayCheckIns: tenants.filter((t: any) => t.startDate === new Date().toISOString().split('T')[0]).length,
        todayCheckOuts: 0
      },
      charts: {
        financials: financialsChart,
        occupancy: occupancyChart,
        roomTypes: roomTypeDistribution.length > 0 ? roomTypeDistribution : [{ name: 'Standard', value: roomsCount }]
      },
      notices,
      buildings,
      tenants,
      invoices,
      employees,
      complaints,
      expenses
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
