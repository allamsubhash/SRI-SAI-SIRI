import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db';

export async function GET() {
  try {
    const employees = await dbService.getEmployees();
    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check if it's a pay salary action
    if (data.action === 'pay_salary') {
      const { employeeId, amount, bonus, deductions, advancePaid } = data;
      if (!employeeId || amount === undefined) {
        return NextResponse.json({ error: 'Employee ID and salary amount are required' }, { status: 400 });
      }
      await dbService.paySalary(
        employeeId, 
        parseFloat(amount), 
        parseFloat(bonus || 0), 
        parseFloat(deductions || 0), 
        parseFloat(advancePaid || 0)
      );
      return NextResponse.json({ success: true });
    }

    // Default: create employee
    const required = ['name', 'phone', 'address', 'role', 'salary', 'joiningDate'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 });
      }
    }

    const newEmp = await dbService.createEmployee({
      name: data.name,
      phone: data.phone,
      address: data.address,
      role: data.role,
      salary: parseFloat(data.salary),
      status: 'ACTIVE',
      bankDetails: data.bankDetails || 'N/A',
      emergencyContact: data.emergencyContact || 'N/A',
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=256&auto=format&fit=crop',
      joiningDate: data.joiningDate
    });

    return NextResponse.json({ success: true, employee: newEmp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }
    await dbService.updateEmployee(id, data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    await dbService.deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
