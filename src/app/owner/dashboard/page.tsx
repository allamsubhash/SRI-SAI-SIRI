'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Users, 
  Bed, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  Wrench,
  CheckCircle,
  FileSpreadsheet,
  Activity,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Calendar,
  X,
  Plus,
  ChevronRight,
  UserCheck,
  Check,
  CreditCard,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

export default function OwnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dashboardModal, setDashboardModal] = useState<
    'OCCUPANCY' | 'COLLECTION' | 'TICKETS' | 'SALARY' | 'BUILDINGS' | 
    'ROOMS' | 'TENANTS' | 'EXPENSES' | 'STAFF' | 'ADD_TENANT' | 
    'RECORD_PAYMENT' | 'RAISE_COMPLAINT' | 'CREATE_NOTICE' | null
  >(null);
  
  const [activeHostelView, setActiveHostelView] = useState<'BUILDING' | 'FLOOR'>('BUILDING');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<any>(null);
  const [selectedTenantDetail, setSelectedTenantDetail] = useState<any>(null);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<any>(null);

  const [hoveredRoom, setHoveredRoom] = useState<any>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState<boolean>(false);
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'>('ALL');
  
  // Wizard state for Add Tenant
  const [addTenantStep, setAddTenantStep] = useState<1 | 2 | 3>(1);
  const [addTenantData, setAddTenantData] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    emergencyName: '',
    emergencyRelation: 'Parent',
    emergencyPhone: '',
    idType: 'Aadhar Card',
    idNumber: '',
    building: 'Main Campus Building',
    floor: '1',
    room: 'A-101', 
    bed: '1', 
    moveInDate: '2026-08-17', 
    rent: '8500', 
    deposit: '17000',
    paymentMethod: 'UPI',
    paymentRef: ''
  });

  // Record Payment Form state
  const [recordPaymentData, setRecordPaymentData] = useState({ tenant: 'Priya Sharma', room: 'B-201', amount: '8500', method: 'UPI' });

  // Raise Complaint Form state
  const [complaintData, setComplaintData] = useState({ room: 'A-101', category: 'AC Repair', priority: 'HIGH', desc: '' });

  // Notification Popup states (Small Popups - 380px)
  const [successPopup, setSuccessPopup] = useState<{ isOpen: boolean; title: string; subtitle?: string; amount?: string } | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; title: string; subtitle?: string } | null>(null);
  const [confirmPopup, setConfirmPopup] = useState<{ isOpen: boolean; title: string; subtitle?: string; onConfirm?: () => void } | null>(null);

  const emptyMetrics = {
    metrics: {
      buildings: 0,
      floors: 0,
      rooms: 0,
      occupiedRooms: 0,
      vacantRooms: 0,
      beds: 0,
      occupiedBeds: 0,
      vacantBeds: 0,
      occupancyRate: 0,
      tenants: 0,
      monthlyIncome: 0,
      pendingRent: 0,
      overdueDues: 0,
      unpaidInvoicesCount: 0,
      monthlyExpenses: 0,
      netProfit: 0,
      employeeSalaryDue: 0,
      maintenanceRequests: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0
    },
    charts: {
      financials: [
        { name: new Date().toLocaleString('en-IN', { month: 'short' }), income: 0, expenses: 0, profit: 0 }
      ],
      occupancy: [
        { name: 'Occupied Beds', value: 0 },
        { name: 'Vacant Beds', value: 0 }
      ],
      roomTypes: []
    },
    settings: { hostelName: 'Sri Sai Siri Boys Hostel' },
    notices: [],
    buildings: [],
    tenants: [],
    invoices: [],
    employees: [],
    complaints: [],
    expenses: []
  };

  useEffect(() => {
    setMounted(true);
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.metrics) {
          setData(resData);
        } else {
          setData(emptyMetrics);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard fetch error:', err);
        setData(emptyMetrics);
        setLoading(false);
      });
  }, []);

  if (!mounted || loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-900 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-zinc-900 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeData = data || emptyMetrics;
  const metrics = activeData?.metrics || emptyMetrics.metrics;
  const charts = activeData?.charts || emptyMetrics.charts;

  const DONUT_COLORS = ['#8B5CF6', '#06B6D4', '#F97316', '#10B981'];

  const donutData = [
    { name: 'Occupied', value: metrics.occupiedBeds || 0, color: '#8B5CF6', percentage: `${metrics.occupancyRate || 0}%` },
    { name: 'Vacant', value: metrics.vacantBeds || 0, color: '#06B6D4', percentage: `${metrics.beds > 0 ? Math.round((metrics.vacantBeds / metrics.beds) * 100) : 0}%` },
    { name: 'Maintenance', value: metrics.maintenanceRequests || 0, color: '#F97316', percentage: '0%' }
  ];

  const allRooms = React.useMemo(() => {
    const list: any[] = [];
    if (activeData.buildings && Array.isArray(activeData.buildings)) {
      activeData.buildings.forEach((b: any) => {
        b.floors?.forEach((f: any) => {
          f.rooms?.forEach((r: any) => {
            const occupiedBed = r.beds?.find((bed: any) => bed.tenantName || bed.tenantId);
            list.push({
              number: r.number,
              floor: f.number,
              status: r.status === 'OCCUPIED' ? 'Occupied' : (r.status === 'MAINTENANCE' ? 'Maintenance' : 'Vacant'),
              beds: r.capacity || r.beds?.length || 2,
              tenantName: occupiedBed?.tenantName || (r.status === 'OCCUPIED' ? 'Occupied Room' : (r.status === 'MAINTENANCE' ? 'Under Repair' : 'Vacant Room')),
              phone: occupiedBed ? '+91 Resident' : '-',
              email: occupiedBed ? 'Resident Account' : '-',
              rent: r.rent || 8500,
              paymentStatus: r.status === 'OCCUPIED' ? 'Active' : 'Ready'
            });
          });
        });
      });
    }
    return list;
  }, [activeData.buildings]);

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 pb-16 select-none relative">
      
      {/* 👑 1. HERO PROPERTY OWNER PROFILE CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              PROPERTY OWNER & ADMIN
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              SYSTEM ACTIVE • {metrics.rooms || 0} ROOMS
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            {activeData.settings?.hostelName || 'Sri Sai Siri Hostel ERP'}
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 tenant-text-accent" />
            <span>Property Administrator: <strong className="text-[#1C2522] dark:text-[#F2F5F2] font-bold">Alok Sharma</strong> • Main Campus</span>
          </p>
        </div>

        {/* Total Rooms & Occupancy Quick Spot Pills */}
        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <div className="flex-1 md:flex-none p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-center">
            <span className="text-[10px] font-extrabold text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block mb-0.5">TOTAL ROOMS</span>
            <span className="text-xl font-black tenant-text-accent">{metrics.rooms || 0}</span>
          </div>
          <div className="flex-1 md:flex-none p-4 rounded-2xl tenant-bg-soft border tenant-border-accent text-center">
            <span className="text-[10px] font-extrabold tenant-text-accent uppercase tracking-wider block mb-0.5">OCCUPANCY</span>
            <span className="text-xl font-black tenant-text-accent">{metrics.occupancyRate || 0}% ({metrics.occupiedBeds || 0} Beds)</span>
          </div>
        </div>
      </div>

      {/* 📊 2. COMPACT QUICK STATUS CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CARD 1: OCCUPANCY */}
        <div 
          onClick={() => setDashboardModal('ROOMS')}
          className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4]">
            <span>OCCUPANCY RATE</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] tenant-bg-soft tenant-text-accent border tenant-border-accent font-black">
              {metrics.occupancyRate || 0}% Occupied
            </span>
          </div>
          <div className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            {metrics.occupiedBeds || 0} / {metrics.beds || 0} Beds
          </div>
          <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center justify-between">
            <span>{metrics.vacantBeds || 0} Beds available</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* CARD 2: MONTHLY REVENUE */}
        <div 
          onClick={() => setDashboardModal('COLLECTION')}
          className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4]">
            <span>MONTHLY REVENUE</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-black">
              Settled
            </span>
          </div>
          <div className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            ₹{(metrics.monthlyIncome || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center justify-between">
            <span>Collections this month</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* CARD 3: PENDING DUES */}
        <div 
          onClick={() => setDashboardModal('COLLECTION')}
          className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4]">
            <span>PENDING DUES</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-black">
              Pending
            </span>
          </div>
          <div className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            ₹{(metrics.pendingRent || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center justify-between">
            <span>{metrics.unpaidInvoicesCount || 0} Unpaid Invoices</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* CARD 4: MAINTENANCE */}
        <div 
          onClick={() => setDashboardModal('TICKETS')}
          className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex justify-between items-center text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4]">
            <span>MAINTENANCE</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-black">
              {metrics.maintenanceRequests || 0} Active
            </span>
          </div>
          <div className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            {metrics.maintenanceRequests || 0} Tickets
          </div>
          <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-medium flex items-center justify-between">
            <span>Assigned to staff</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#929B96] group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>
      </div>

      {/* 💳 3. PROMINENT FINANCIAL PERFORMANCE & CASHFLOW CARD */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DDD8CE] dark:border-[#293832] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-[#1C2522] dark:text-[#F2F5F2]">Financial Performance & Revenue Trends</h3>
              <span className="text-[10px] font-black px-3 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
                LIVE LEDGER
              </span>
            </div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Real-time revenue collections vs operational expenses trajectory</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDashboardModal('RECORD_PAYMENT')}
              className="py-2.5 px-5 rounded-2xl tenant-bg-accent font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-transform cursor-pointer shrink-0"
            >
              RECORD PAYMENT →
            </button>
            <button
              onClick={() => setDashboardModal('ADD_TENANT')}
              className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform cursor-pointer shrink-0"
            >
              + ADD TENANT
            </button>
          </div>
        </div>

        {/* Financial Area Chart Visual */}
        <div className="h-60 w-full pt-1">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
              <AreaChart data={charts.financials || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tenantOwnerIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--tenant-accent-color, #0891B2)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--tenant-accent-color, #0891B2)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="tenantOwnerExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD8CE" opacity={0.4} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#68736E' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#68736E' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141D19', borderRadius: '16px', border: '1px solid #293832', color: '#F2F5F2', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="income" stroke="var(--tenant-accent-color, #0891B2)" strokeWidth={3} fillOpacity={1} fill="url(#tenantOwnerIncomeGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#tenantOwnerExpenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">MONTHLY COLLECTIONS</span>
            <div className="text-xl font-black text-[#1C2522] dark:text-[#F2F5F2]">₹{(metrics.monthlyIncome || 0).toLocaleString()}</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">Settled to bank account</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-1">
            <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-wider block">OPERATIONAL EXPENSES</span>
            <div className="text-xl font-black text-orange-600 dark:text-orange-400">₹{(metrics.monthlyExpenses || 0).toLocaleString()}</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">Utilities, Wi-Fi & Maintenance</p>
          </div>

          <div className="p-4 rounded-2xl tenant-bg-soft border tenant-border-accent space-y-1">
            <span className="text-[10px] font-black tenant-text-accent uppercase tracking-wider block">NET OPERATING SURPLUS</span>
            <div className="text-xl font-black tenant-text-accent">₹{((metrics.monthlyIncome || 0) - (metrics.monthlyExpenses || 0)).toLocaleString()}</div>
            <p className="text-xs tenant-text-accent font-medium">Positive cashflow margin</p>
          </div>
        </div>
      </div>

      {/* 🏢 4. FLOOR & ROOM ALLOCATION DIRECTORY GRID */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#DDD8CE] dark:border-[#293832] pb-4">
          <div>
            <h3 className="font-black text-lg text-[#1C2522] dark:text-[#F2F5F2]">Floor & Room Allocation Directory</h3>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Filter rooms by floor to inspect resident allocations and room statuses</p>
          </div>

          {/* FLOOR SELECTOR PILL TABS */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setSelectedFloor(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedFloor === null 
                  ? 'tenant-bg-accent text-white shadow-sm' 
                  : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
              }`}
            >
              All Floors
            </button>
            {[1, 2, 3].map((fl) => (
              <button
                key={fl}
                type="button"
                onClick={() => setSelectedFloor(selectedFloor === fl ? null : fl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedFloor === fl 
                    ? 'tenant-bg-accent text-white shadow-sm' 
                    : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
                }`}
              >
                Floor {fl}
              </button>
            ))}
          </div>
        </div>

        {/* ROOM CARDS MATRIX */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {allRooms
          .filter(r => selectedFloor === null || r.floor === selectedFloor)
          .map((rm) => (
            <motion.div
              key={rm.number}
              whileHover={{ y: -3, scale: 1.02 }}
              onClick={() => setSelectedRoomDetail(rm)}
              className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-left cursor-pointer transition-all hover:tenant-border-accent group space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-xs text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">Room {rm.number}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                  rm.status === 'Occupied' 
                    ? 'tenant-bg-soft tenant-text-accent tenant-border-accent' 
                    : rm.status === 'Vacant'
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
                    : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                }`}>
                  {rm.status}
                </span>
              </div>
              <p className="text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] truncate">{rm.tenantName}</p>
              <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] font-medium">Floor {rm.floor} • {rm.beds} Sharing Spot</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 👥 5. RECENT ACTIVITY STREAM & MANAGEMENT WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT TENANT ACTIVITY STREAM */}
        <div className="p-6 sm:p-7 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
            <div>
              <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2]">Recent Activity Log</h3>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">Real-time check-in and payment events</p>
            </div>
            <button 
              onClick={() => setDashboardModal('TENANTS')}
              className="text-xs font-black tenant-text-accent hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl tenant-bg-soft border tenant-border-accent text-xs font-black flex items-center justify-center tenant-text-accent">
                  P
                </div>
                <div>
                  <p className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">Priya Sharma checked in</p>
                  <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Room B-201 • Active Lease</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-[#68736E] dark:text-[#9BAAA4]">10:30 AM</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-black flex items-center justify-center">
                  ₹
                </div>
                <div>
                  <p className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">Rent payment received (Rahul Verma)</p>
                  <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">₹8,500 settled via UPI</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-[#68736E] dark:text-[#9BAAA4]">09:15 AM</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-black flex items-center justify-center">
                  🔧
                </div>
                <div>
                  <p className="font-bold text-[#1C2522] dark:text-[#F2F5F2]">AC maintenance ticket logged</p>
                  <p className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">Room A-101 • Priority High</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-[#68736E] dark:text-[#9BAAA4]">Yesterday</span>
            </div>
          </div>
        </div>

        {/* QUICK MANAGEMENT ACTIONS BAR */}
        <div className="p-6 sm:p-7 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#DDD8CE] dark:border-[#293832]">
            <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2]">Quick Management Actions</h3>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">Shortcuts for administrative workflows</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDashboardModal('ADD_TENANT')}
              className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] hover:tenant-border-accent transition-all text-left cursor-pointer group space-y-1"
            >
              <Users className="w-4 h-4 tenant-text-accent" />
              <span className="font-black text-xs text-[#1C2522] dark:text-[#F2F5F2] block group-hover:tenant-text-accent transition-colors">Add Tenant</span>
              <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block">Register new resident</span>
            </button>

            <button
              onClick={() => setDashboardModal('RECORD_PAYMENT')}
              className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] hover:tenant-border-accent transition-all text-left cursor-pointer group space-y-1"
            >
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-black text-xs text-[#1C2522] dark:text-[#F2F5F2] block group-hover:tenant-text-accent transition-colors">Record Payment</span>
              <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block">Log settled rent</span>
            </button>

            <button
              onClick={() => setDashboardModal('RAISE_COMPLAINT')}
              className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] hover:tenant-border-accent transition-all text-left cursor-pointer group space-y-1"
            >
              <Wrench className="w-4 h-4 text-orange-500" />
              <span className="font-black text-xs text-[#1C2522] dark:text-[#F2F5F2] block group-hover:tenant-text-accent transition-colors">Raise Ticket</span>
              <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block">Log maintenance task</span>
            </button>

            <button
              onClick={() => setDashboardModal('CREATE_NOTICE')}
              className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] hover:tenant-border-accent transition-all text-left cursor-pointer group space-y-1"
            >
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="font-black text-xs text-[#1C2522] dark:text-[#F2F5F2] block group-hover:tenant-text-accent transition-colors">Send Notice</span>
              <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4] block">Broadcast alert</span>
            </button>
          </div>
        </div>

      </div>

      {/* 🚀 FRESH REDESIGNED OPERATIONAL MANAGEMENT SUITE */}
      <div className="space-y-4 text-left pt-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-[#1C2522] dark:text-[#F2F5F2] text-lg tracking-tight">Executive Operational Suite</h3>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium mt-0.5">High-priority shortcuts for daily property administration and staff management</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent hidden sm:inline-block">
            FRESH MODULES
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* FRESH SUITE 1: FAST SETTLEMENT & LEDGER */}
          <div className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all space-y-4 group">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black">
                ₹
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                LEDGER HUB
              </span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
                Financial Settlement
              </h4>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                Record rent, issue GST receipts & track collections.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setDashboardModal('RECORD_PAYMENT')}
                className="w-full py-2.5 px-4 rounded-xl tenant-bg-accent text-xs font-black shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span>Record Rent Payment</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => setDashboardModal('COLLECTION')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] text-xs font-bold flex items-center justify-between cursor-pointer hover:tenant-border-accent transition-colors"
              >
                <span>Full Ledger History</span>
                <span className="text-[10px] text-[#68736E] dark:text-[#9BAAA4]">₹1.25L</span>
              </button>
            </div>
          </div>

          {/* FRESH SUITE 2: RESIDENT ONBOARDING & ROOM MAP */}
          <div className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all space-y-4 group">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center justify-center font-black">
                🔑
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
                ONBOARDING
              </span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
                Tenant & Room Hub
              </h4>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                Register new residents, manage lease agreements & beds.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setDashboardModal('ADD_TENANT')}
                className="w-full py-2.5 px-4 rounded-xl tenant-bg-accent text-xs font-black shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span>Register New Tenant</span>
                <span>+</span>
              </button>
              <button
                type="button"
                onClick={() => setDashboardModal('ROOMS')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] text-xs font-bold flex items-center justify-between cursor-pointer hover:tenant-border-accent transition-colors"
              >
                <span>Inspect Room Vacancies</span>
                <span className="text-[10px] tenant-text-accent font-black">10 Vacant</span>
              </button>
            </div>
          </div>

          {/* FRESH SUITE 3: BROADCAST & ANNOUNCEMENTS */}
          <div className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all space-y-4 group">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center font-black">
                📢
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                BROADCAST
              </span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
                Warden Notices
              </h4>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                Publish hostel announcements & maintenance alerts.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setDashboardModal('CREATE_NOTICE')}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-black shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span>Publish New Notice</span>
                <span>📢</span>
              </button>
              <button
                type="button"
                onClick={() => setDashboardModal('TENANTS')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] text-xs font-bold flex items-center justify-between cursor-pointer hover:tenant-border-accent transition-colors"
              >
                <span>Active Announcements</span>
                <span className="text-[10px] text-rose-500 font-black">3 Active</span>
              </button>
            </div>
          </div>

          {/* FRESH SUITE 4: MAINTENANCE DISPATCH & STAFF */}
          <div className="p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm hover:tenant-border-accent transition-all space-y-4 group">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-black">
                🔧
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                DISPATCH
              </span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
                Maintenance & Staff
              </h4>
              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
                Dispatch technicians & oversee warden staff tasks.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setDashboardModal('RAISE_COMPLAINT')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 text-white text-xs font-black shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span>Log Maintenance Ticket</span>
                <span>🔧</span>
              </button>
              <button
                type="button"
                onClick={() => setDashboardModal('STAFF')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-[#1C2522] dark:text-[#F2F5F2] text-xs font-bold flex items-center justify-between cursor-pointer hover:tenant-border-accent transition-colors"
              >
                <span>Warden & Staff Roster</span>
                <span className="text-[10px] text-amber-500 font-black">4 Staff</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 🔮 CENTERED ROOM DETAILS MODAL */}
      {selectedRoomDetail && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedRoomDetail(null)}
          title={`ROOM ${selectedRoomDetail.number}`}
          subtitle={`Floor ${selectedRoomDetail.floor} • Room Details & Resident`}
          size="sm"
          accentColor="purple"
        >
          <div className="space-y-4 text-left font-sans">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold">{selectedRoomDetail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity</span>
                <span className="text-slate-900 dark:text-white">{selectedRoomDetail.beds} Beds Sharing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Rent</span>
                <span className="text-emerald-600 font-extrabold">₹{selectedRoomDetail.rent?.toLocaleString() || 8500}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">Resident Tenant</span>
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <p className="font-extrabold text-indigo-900 dark:text-indigo-200 text-sm">{selectedRoomDetail.tenantName}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{selectedRoomDetail.phone}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{selectedRoomDetail.email}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => { setSelectedRoomDetail(null); setDashboardModal('TENANTS'); }}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
              >
                View Tenant Profile
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSelectedRoomDetail(null); setDashboardModal('RECORD_PAYMENT'); }}
                  className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => { setSelectedRoomDetail(null); setDashboardModal('TICKETS'); }}
                  className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  View Tickets
                </button>
              </div>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 🏬 1. ROOMS OVERVIEW MODAL (LARGE - 820px, matching reference image) */}
      {dashboardModal === 'ROOMS' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Rooms Overview"
          subtitle="48 Total Rooms • Interactive Asset Roster"
          size="lg"
          accentColor="purple"
        >
          <div className="space-y-5">
            {/* Top Summary Row matching reference image header: Total 48, Occupied 36, Vacant 10, Maint 2, Reserved 0 */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-slate-400 text-[10px] block">Total</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">48</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] block">Occupied</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">36</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] block">Vacant</span>
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">10</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] block">Maint.</span>
                <span className="text-xl font-black text-orange-500">2</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] block">Reserved</span>
                <span className="text-xl font-black text-slate-400">0</span>
              </div>
            </div>

            <div className="flex gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              {(['ALL', 'OCCUPIED', 'VACANT', 'MAINTENANCE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRoomFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    roomFilter === tab 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Room rows matching input_file_0.png reference styling */}
            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {[
                { number: 'A-101', floor: 1, beds: 2, tenant: 'Aarav Mehta', status: 'Occupied', rent: 8500 },
                { number: 'B-201', floor: 2, beds: 2, tenant: 'Vacant Spot', status: 'Vacant', rent: 8500 },
                { number: 'C-301', floor: 3, beds: 2, tenant: 'AC Unit Repair', status: 'Maintenance', rent: 0 },
                { number: 'C-302', floor: 3, beds: 2, tenant: 'Ananya Roy', status: 'Occupied', rent: 8500 }
              ]
              .filter(r => roomFilter === 'ALL' || r.status.toUpperCase() === roomFilter)
              .map((room, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setDashboardModal(null);
                    setSelectedRoomDetail({
                      number: room.number,
                      floor: room.floor,
                      status: room.status,
                      beds: room.beds,
                      tenantName: room.tenant,
                      phone: '+91 97766 55443',
                      email: `${room.tenant.toLowerCase().replace(' ', '')}@gmail.com`,
                      rent: room.rent
                    });
                  }}
                  className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-purple-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 font-black flex items-center justify-center text-xs">
                      {room.number}
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-purple-600 transition-colors">Floor {room.floor} • {room.beds} Beds</p>
                      <p className="text-[10px] text-slate-400 font-medium">Tenant: {room.tenant}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      room.status === 'Occupied' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      room.status === 'Vacant' ? 'bg-cyan-500/15 text-cyan-600' : 'bg-orange-500/15 text-orange-600'
                    }`}>
                      {room.status}
                    </span>
                    <span className="text-xs font-bold text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setDashboardModal(null)}
                className="w-full py-3 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-[1.01] transition-transform cursor-pointer"
              >
                View All Rooms →
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 👤 2. TENANT DETAILS MODAL (MEDIUM - 540px, matching reference image) */}
      {selectedTenantDetail && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedTenantDetail(null)}
          onBack={() => setSelectedTenantDetail(null)}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-5 text-left">
            {/* Header info card matching reference image */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shrink-0">
                {selectedTenantDetail.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedTenantDetail.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                    {selectedTenantDetail.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Room {selectedTenantDetail.roomNumber} • 2 Beds</p>
                <div className="flex gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedTenantDetail.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedTenantDetail.email}</span>
                </div>
              </div>
            </div>

            {/* 3 Detail Metric Cards matching reference image */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] font-bold block">Check-in Date</span>
                <span className="font-black text-slate-900 dark:text-white mt-1 block">{selectedTenantDetail.moveInDate || '10 Jan 2026'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] font-bold block">Monthly Rent</span>
                <span className="font-black text-slate-900 dark:text-white mt-1 block">₹{(selectedTenantDetail.rent || 8500).toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] font-bold block">Payment Status</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 mt-1 block">Paid</span>
              </div>
            </div>

            {/* Bottom Action Buttons matching reference image */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedTenantDetail(null);
                  setDashboardModal('COLLECTION');
                }}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-extrabold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Payment History
              </button>
              <button
                onClick={() => {
                  setSelectedTenantDetail(null);
                  setSuccessPopup({ isOpen: true, title: 'Profile Updated', subtitle: `${selectedTenantDetail.name}'s profile verified.` });
                }}
                className="py-3 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                View Profile
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 👥 TENANT OVERVIEW MODAL (LARGE - 820px) */}
      {dashboardModal === 'TENANTS' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Tenants Directory"
          subtitle="48 Active Registered Tenants • Master Roster"
          size="lg"
          accentColor="purple"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-xs text-left">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-slate-400 font-bold block">Total Tenants</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">48</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-slate-400 font-bold block">Active Leases</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">36</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-slate-400 font-bold block">Check-ins Today</span>
                <span className="text-xl font-black text-blue-600 dark:text-cyan-400">1</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-slate-400 font-bold block">Pending Rent</span>
                <span className="text-xl font-black text-amber-500">12</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {activeData.tenants?.map((t: any) => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTenantDetail(t)}
                  className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-left hover:border-purple-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-purple-600 transition-colors">{t.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Room {t.roomNumber} (Bed {t.bedNumber}) • Joined: {t.moveInDate}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs flex items-center gap-3">
                    <div>
                      <div className="font-bold text-slate-700 dark:text-zinc-300">{t.phone}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">₹8,500 Paid</div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Showing active tenant records</span>
              <button 
                onClick={() => setDashboardModal('ADD_TENANT')}
                className="py-2.5 px-4 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                + Register New Tenant
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 💳 3. PAYMENT DETAILS MODAL (MEDIUM - 540px, matching reference image) */}
      {selectedPaymentDetail && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedPaymentDetail(null)}
          badge={<span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">Paid</span>}
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-5 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedPaymentDetail.tenantName}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Room {selectedPaymentDetail.roomNumber}</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Monthly Rent</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">₹{(selectedPaymentDetail.amount || 8500).toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] font-bold block">Payment Date</span>
                <span className="font-extrabold text-slate-900 dark:text-white mt-1 block">{selectedPaymentDetail.date || '01 May 2026'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] font-bold block">Payment Method</span>
                <span className="font-extrabold text-slate-900 dark:text-white mt-1 block">{selectedPaymentDetail.method || 'UPI'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-slate-400 text-[10px] font-bold block">Transaction ID</span>
                <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-zinc-300 mt-1 block">{selectedPaymentDetail.id || 'TXN123456789'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSuccessPopup({ isOpen: true, title: 'Receipt Generated', subtitle: 'Digital receipt PDF generated and sent to tenant.' })}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-extrabold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                View Receipt
              </button>
              <button
                onClick={() => {
                  setSelectedPaymentDetail(null);
                  setDashboardModal('RECORD_PAYMENT');
                }}
                className="py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 💳 PAYMENT CENTER MODAL (LARGE - 820px) */}
      {dashboardModal === 'COLLECTION' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Payment Center"
          subtitle="Monthly Collection & Rent Invoice Ledger"
          size="lg"
          accentColor="emerald"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-xs text-left">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-slate-400 font-bold block">Monthly Collection</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹1,25,000</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-slate-400 font-bold block">Pending Rent</span>
                <span className="text-xl font-black text-amber-500">₹68,450</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-slate-400 font-bold block">Overdue</span>
                <span className="text-xl font-black text-rose-500">₹12,000</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-slate-400 font-bold block">Outstanding</span>
                <span className="text-xl font-black text-blue-600 dark:text-cyan-400">12 Invoices</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {activeData.invoices?.map((inv: any) => (
                <div 
                  key={inv.id} 
                  onClick={() => setSelectedPaymentDetail(inv)}
                  className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-left hover:border-emerald-500/50 cursor-pointer transition-all group"
                >
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-emerald-600 transition-colors">{inv.tenantName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Ref: {inv.id} • Room {inv.roomNumber} ({inv.date || '01 May 2026'})</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      inv.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-500'
                    }`}>
                      ₹{inv.amount.toLocaleString()} ({inv.status})
                    </span>
                    <span className="text-xs font-bold text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setDashboardModal('RECORD_PAYMENT')}
                className="py-2.5 px-5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                + Record New Payment
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 💸 4. EXPENSE OVERVIEW MODAL (LARGE - 820px) */}
      {dashboardModal === 'EXPENSES' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Expense Overview"
          subtitle="Monthly Operating Costs & Overhead Bills"
          size="lg"
          accentColor="orange"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-left flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-bold text-xs block">Total Monthly Expenses</span>
                <span className="text-2xl font-black text-orange-500">₹56,550</span>
              </div>
              <span className="text-xs font-bold text-slate-500">3 Logged Overhead Bills</span>
            </div>

            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {activeData.expenses?.map((exp: any) => (
                <div key={exp.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-left">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{exp.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Logged: {exp.date} • Category: {exp.category}</p>
                  </div>
                  <span className="text-sm font-black text-rose-500">₹{exp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </NeonModal>
      )}

      {/* 🏢 5. BUILDING OVERVIEW MODAL (LARGE - 820px) */}
      {dashboardModal === 'BUILDINGS' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Building Overview"
          subtitle="Registered Property Structure & Asset Breakdown"
          size="lg"
          accentColor="blue"
        >
          <div className="space-y-4 text-left">
            {activeData.buildings?.map((b: any) => (
              <div key={b.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{b.address}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-cyan-400 font-black text-xs">
                    {b.totalFloors} Floors
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs font-bold">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800">
                    <span className="text-slate-400 block text-[10px]">Total Rooms</span>
                    <span className="text-slate-900 dark:text-white font-black text-sm">48 Rooms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800">
                    <span className="text-slate-400 block text-[10px]">Total Beds</span>
                    <span className="text-slate-900 dark:text-white font-black text-sm">48 Beds</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800">
                    <span className="text-slate-400 block text-[10px]">Occupancy</span>
                    <span className="text-emerald-600 font-black text-sm">75% (36/48)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </NeonModal>
      )}

      {/* 🔧 6. MAINTENANCE REQUEST TIMELINE MODAL (MEDIUM - 540px, matching reference image) */}
      {dashboardModal === 'TICKETS' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Maintenance Request"
          badge={<span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-black">In Progress</span>}
          size="md"
          accentColor="orange"
        >
          <div className="space-y-5 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Issue: AC not cooling</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Room C-302 • Reported by Ananya Roy</p>
            </div>

            {/* Timeline matching input_file_0.png reference styling */}
            <div className="space-y-4 pt-2 pl-2">
              <div className="flex items-start gap-3 relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 z-10" />
                <div className="w-0.5 absolute left-[5px] top-4 bottom-[-16px] bg-slate-200 dark:bg-zinc-800" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">10 May 2026 10:30 AM</p>
                  <p className="text-[11px] text-slate-500 font-medium">Reported</p>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 z-10" />
                <div className="w-0.5 absolute left-[5px] top-4 bottom-[-16px] bg-slate-200 dark:bg-zinc-800" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">10 May 2026 11:00 AM</p>
                  <p className="text-[11px] text-slate-500 font-medium">Assigned to Raj Kumar</p>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0 z-10" />
                <div className="w-0.5 absolute left-[5px] top-4 bottom-[-16px] bg-slate-200 dark:bg-zinc-800" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">10 May 2026 02:30 PM</p>
                  <p className="text-[11px] text-orange-500 font-bold">In Progress</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-zinc-700 mt-1 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400">--</p>
                  <p className="text-[11px] text-slate-400 font-medium">Resolved</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-center">
              <button
                onClick={() => setSuccessPopup({ isOpen: true, title: 'Ticket Updated', subtitle: 'Maintenance ticket status marked resolved.' })}
                className="text-xs font-black text-orange-500 hover:underline cursor-pointer"
              >
                View Full Details →
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 👨‍💼 7. STAFF OVERVIEW MODAL (MEDIUM - 540px) */}
      {dashboardModal === 'STAFF' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Staff & Employee Roster"
          subtitle="4 Active Employees & Staff Payroll Status"
          size="md"
          accentColor="teal"
        >
          <div className="space-y-3 text-left">
            {activeData.employees?.map((emp: any) => (
              <div key={emp.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 font-black flex items-center justify-center text-sm">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{emp.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{emp.role} • {emp.phone}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-black text-slate-900 dark:text-white block">₹{emp.salary.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Paid</span>
                </div>
              </div>
            ))}
          </div>
        </NeonModal>
      )}

      {/* 📝 8. ADD TENANT 3-STEP FULL-DETAIL REGISTRATION WIZARD MODAL */}
      {dashboardModal === 'ADD_TENANT' && (
        <NeonModal
          isOpen={true}
          onClose={() => { setDashboardModal(null); setAddTenantStep(1); }}
          title={`Register New Resident (Step ${addTenantStep}/3)`}
          subtitle={
            addTenantStep === 1 ? 'Personal & Emergency Contact Information' :
            addTenantStep === 2 ? 'Room Lease & Bed Allocation' :
            'Rent Tariff, Security Deposit & Payment Settlement'
          }
          size="lg"
          accentColor="cyan"
        >
          <div className="space-y-5 text-left font-sans">
            {/* Step Progress Dots */}
            <div className="flex items-center justify-center gap-3 py-1">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    addTenantStep === step 
                      ? 'tenant-bg-accent text-white shadow-md scale-110' 
                      : addTenantStep > step 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] border border-[#DDD8CE] dark:border-[#293832]'
                  }`}>
                    {addTenantStep > step ? '✓' : step}
                  </div>
                  {step < 3 && <div className={`w-10 h-0.5 ${addTenantStep > step ? 'bg-emerald-500' : 'bg-[#DDD8CE] dark:bg-[#293832]'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Personal, Emergency & ID Info */}
            {addTenantStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Full Legal Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma"
                      value={addTenantData.name}
                      onChange={(e) => setAddTenantData({ ...addTenantData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Mobile Phone Number *</label>
                    <input 
                      type="text" 
                      placeholder="+91 98765 43210"
                      value={addTenantData.phone}
                      onChange={(e) => setAddTenantData({ ...addTenantData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="rahul.sharma@example.com"
                    value={addTenantData.email}
                    onChange={(e) => setAddTenantData({ ...addTenantData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
                  />
                </div>

                {/* Emergency Contact Sub-section */}
                <div className="p-3.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] space-y-3">
                  <span className="text-xs font-black tenant-text-accent block">Emergency Contact Person</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Contact Person Name</label>
                      <input 
                        type="text" 
                        placeholder="Parent / Guardian Name"
                        value={addTenantData.emergencyName}
                        onChange={(e) => setAddTenantData({ ...addTenantData, emergencyName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Relationship</label>
                      <select 
                        value={addTenantData.emergencyRelation}
                        onChange={(e) => setAddTenantData({ ...addTenantData, emergencyRelation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                      >
                        <option value="Parent">Parent</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Spouse">Spouse</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Emergency Phone</label>
                      <input 
                        type="text" 
                        placeholder="+91 99887 76655"
                        value={addTenantData.emergencyPhone}
                        onChange={(e) => setAddTenantData({ ...addTenantData, emergencyPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                      />
                    </div>
                  </div>
                </div>

                {/* ID Proof Sub-section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Govt ID Proof Type</label>
                    <select 
                      value={addTenantData.idType}
                      onChange={(e) => setAddTenantData({ ...addTenantData, idType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    >
                      <option value="Aadhar Card">Aadhar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">ID Number / Reference</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5421 8963 1245"
                      value={addTenantData.idNumber}
                      onChange={(e) => setAddTenantData({ ...addTenantData, idNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Room & Spot Info */}
            {addTenantStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Property Building</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={addTenantData.building}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] opacity-80 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Floor Level</label>
                    <select 
                      value={addTenantData.floor}
                      onChange={(e) => setAddTenantData({ ...addTenantData, floor: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    >
                      <option value="1">Floor 1</option>
                      <option value="2">Floor 2</option>
                      <option value="3">Floor 3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Allocated Room Number *</label>
                    <select 
                      value={addTenantData.room}
                      onChange={(e) => setAddTenantData({ ...addTenantData, room: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    >
                      <option value="A-101">Room A-101 (Floor 1 • 2 Beds)</option>
                      <option value="A-102">Room A-102 (Floor 1 • Vacant)</option>
                      <option value="B-201">Room B-201 (Floor 2 • 2 Beds)</option>
                      <option value="B-202">Room B-202 (Floor 2 • 2 Beds)</option>
                      <option value="C-301">Room C-301 (Floor 3 • Vacant)</option>
                      <option value="C-302">Room C-302 (Floor 3 • 3 Beds)</option>
                      <option value="C-303">Room C-303 (Floor 3 • Vacant)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Assigned Bed Spot *</label>
                    <select 
                      value={addTenantData.bed}
                      onChange={(e) => setAddTenantData({ ...addTenantData, bed: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    >
                      <option value="1">Bed Spot #1 (Window View)</option>
                      <option value="2">Bed Spot #2 (Side Desk)</option>
                      <option value="3">Bed Spot #3 (Main Area)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Move-In / Lease Start Date</label>
                  <input 
                    type="date" 
                    value={addTenantData.moveInDate}
                    onChange={(e) => setAddTenantData({ ...addTenantData, moveInDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Rent, Deposit & Payment Settlement */}
            {addTenantStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Monthly Rent Tariff (₹) *</label>
                    <input 
                      type="text" 
                      value={addTenantData.rent}
                      onChange={(e) => setAddTenantData({ ...addTenantData, rent: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Refundable Security Deposit (₹) *</label>
                    <input 
                      type="text" 
                      value={addTenantData.deposit}
                      onChange={(e) => setAddTenantData({ ...addTenantData, deposit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Advance Settlement Payment Method</label>
                    <select 
                      value={addTenantData.paymentMethod}
                      onChange={(e) => setAddTenantData({ ...addTenantData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    >
                      <option value="UPI">UPI Payment / PhonePe / GPay</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                      <option value="Cash">Cash Settlement</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-[#1C2522] dark:text-[#F2F5F2] block mb-1">Payment Reference / UTR Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UPI/654897123"
                      value={addTenantData.paymentRef}
                      onChange={(e) => setAddTenantData({ ...addTenantData, paymentRef: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
                    />
                  </div>
                </div>

                {/* Total Initial Due Summary Box */}
                <div className="p-4 rounded-2xl tenant-bg-soft border tenant-border-accent flex justify-between items-center text-xs font-black tenant-text-accent">
                  <span>Total Initial Advance Collected (Rent + Deposit):</span>
                  <span className="text-base font-black">
                    ₹{(Number(addTenantData.rent || 0) + Number(addTenantData.deposit || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-[#DDD8CE] dark:border-[#293832]">
              <button
                type="button"
                onClick={() => { setDashboardModal(null); setAddTenantStep(1); }}
                className="py-2.5 px-5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#1C2522] dark:text-[#F2F5F2] font-bold text-xs border border-[#DDD8CE] dark:border-[#293832] cursor-pointer"
              >
                Cancel
              </button>

              {addTenantStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setAddTenantStep((addTenantStep + 1) as any)}
                  className="py-2.5 px-6 rounded-xl tenant-bg-accent text-xs font-black shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDashboardModal(null);
                    setAddTenantStep(1);
                    setSuccessPopup({
                      isOpen: true,
                      title: 'Tenant Registration Complete!',
                      subtitle: `${addTenantData.name || 'Resident'} allocated to Room ${addTenantData.room} (Bed ${addTenantData.bed}).`
                    });
                  }}
                  className="py-2.5 px-6 rounded-xl tenant-bg-accent text-xs font-black shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  Confirm & Complete Registration ✓
                </button>
              )}
            </div>
          </div>
        </NeonModal>
      )}

      {/* 💸 9. RECORD PAYMENT FORM MODAL (MEDIUM - 540px) */}
      {dashboardModal === 'RECORD_PAYMENT' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Record Payment"
          subtitle="Log Rent Collection or Overhead Invoice"
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Select Tenant</label>
              <select 
                value={recordPaymentData.tenant}
                onChange={(e) => setRecordPaymentData({ ...recordPaymentData, tenant: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Ananya Roy">Ananya Roy (Room C-302)</option>
                <option value="Priya Sharma">Priya Sharma (Room B-201)</option>
                <option value="Rahul Verma">Rahul Verma (Room A-101)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Amount (₹)</label>
                <input 
                  type="text" 
                  value={recordPaymentData.amount}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Payment Method</label>
                <select 
                  value={recordPaymentData.method}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, method: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank">Bank Wire Transfer</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => {
                  setDashboardModal(null);
                  setSuccessPopup({
                    isOpen: true,
                    title: 'Payment Recorded!',
                    subtitle: 'Payment has been recorded successfully.',
                    amount: `₹${recordPaymentData.amount}`
                  });
                }}
                className="py-2.5 px-6 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Record Payment ₹8,500 ✓
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 🛠️ 10. RAISE COMPLAINT FORM MODAL (MEDIUM - 540px) */}
      {dashboardModal === 'RAISE_COMPLAINT' && (
        <NeonModal
          isOpen={true}
          onClose={() => setDashboardModal(null)}
          title="Raise Complaint"
          subtitle="File Maintenance Request for Hostel Room"
          size="md"
          accentColor="orange"
        >
          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Room Number</label>
              <select 
                value={complaintData.room}
                onChange={(e) => setComplaintData({ ...complaintData, room: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              >
                <option value="C-302">Room C-302</option>
                <option value="A-101">Room A-101</option>
                <option value="B-201">Room B-201</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Category</label>
              <div className="flex flex-wrap gap-2">
                {['AC Repair', 'Electrical', 'Plumbing', 'Wi-Fi', 'Cleaning'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setComplaintData({ ...complaintData, category: cat })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      complaintData.category === cat 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe the complaint..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => {
                  setDashboardModal(null);
                  setSuccessPopup({
                    isOpen: true,
                    title: 'Ticket Submitted',
                    subtitle: `Maintenance request logged for Room ${complaintData.room}.`
                  });
                }}
                className="py-2.5 px-6 rounded-2xl bg-orange-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Submit Ticket ✓
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* 🎉 11. SUCCESS POPUP (SMALL - 380px, matching reference image) */}
      {successPopup && successPopup.isOpen && (
        <NeonModal
          isOpen={true}
          onClose={() => setSuccessPopup(null)}
          size="sm"
          accentColor="emerald"
        >
          <div className="py-2 text-center space-y-3">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">SUCCESS</span>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-14 h-14 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-2xl shadow-xl"
            >
              ✓
            </motion.div>

            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{successPopup.title}</h4>
              {successPopup.amount && (
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{successPopup.amount}</p>
              )}
              {successPopup.subtitle && (
                <p className="text-xs text-slate-400 font-medium mt-1">{successPopup.subtitle}</p>
              )}
            </div>

            <button
              onClick={() => setSuccessPopup(null)}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
            >
              Done
            </button>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 12. ERROR POPUP (SMALL - 380px, matching reference image) */}
      {errorPopup && errorPopup.isOpen && (
        <NeonModal
          isOpen={true}
          onClose={() => setErrorPopup(null)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">ERROR</span>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-14 h-14 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center text-2xl shadow-xl"
            >
              ✕
            </motion.div>

            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{errorPopup.title || 'Something went wrong!'}</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">{errorPopup.subtitle || 'Unable to process your request. Please try again.'}</p>
            </div>

            <button
              onClick={() => setErrorPopup(null)}
              className="w-full py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
            >
              Retry
            </button>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 13. CONFIRMATION POPUP (SMALL - 380px, matching reference image) */}
      {confirmPopup && confirmPopup.isOpen && (
        <NeonModal
          isOpen={true}
          onClose={() => setConfirmPopup(null)}
          size="sm"
          accentColor="orange"
        >
          <div className="py-2 text-center space-y-3">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">CONFIRMATION</span>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center text-2xl shadow-md border border-amber-500/30"
            >
              <AlertTriangle className="w-7 h-7" />
            </motion.div>

            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">{confirmPopup.title || 'Delete Room C-302?'}</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">{confirmPopup.subtitle || 'This action cannot be undone. Are you sure?'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setConfirmPopup(null)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-extrabold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmPopup.onConfirm) confirmPopup.onConfirm();
                  setConfirmPopup(null);
                  setSuccessPopup({ isOpen: true, title: 'Action Confirmed', subtitle: 'Operation completed successfully.' });
                }}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
