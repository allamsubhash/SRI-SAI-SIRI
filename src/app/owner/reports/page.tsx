'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Building2, 
  DoorClosed, 
  BedDouble, 
  UserCheck, 
  Users, 
  Wallet, 
  Receipt, 
  Wrench, 
  Briefcase, 
  Warehouse, 
  Megaphone, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  X, 
  Clock, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  FileText,
  DollarSign,
  User,
  Filter
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';

export default function ReportsAndAnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Active Modal State
  const [activeModal, setActiveModal] = useState<
    'BUILDINGS' | 'ROOMS' | 'BEDS' | 'OCCUPIED' | 'AVAILABLE' | 'TENANTS' | 
    'OCCUPANCY_DETAILS' | 'FINANCIAL' | 'ISSUES' | 'STAFF' | 'VISITORS' | 
    'INVENTORY' | 'ACTIVITY' | null
  >(null);

  // On-demand Modal Detail Data State
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalFilter, setModalFilter] = useState('');

  const fetchSummaryData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/reports', {
        headers: { 'Cache-Control': 'no-store' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load summary data`);
      const json = await res.json();
      setSummary(json.summary);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load summary report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, []);

  // Fetch On-Demand Detail Data when a modal opens
  const openReportModal = async (type: typeof activeModal) => {
    setActiveModal(type);
    setModalFilter('');
    setModalData(null);
    setModalLoading(true);

    let detailParam = '';
    if (type === 'BUILDINGS' || type === 'ROOMS' || type === 'BEDS' || type === 'OCCUPIED' || type === 'AVAILABLE' || type === 'OCCUPANCY_DETAILS') {
      detailParam = 'occupancy';
    } else if (type === 'TENANTS') {
      detailParam = 'tenants';
    } else if (type === 'FINANCIAL') {
      detailParam = 'financial';
    } else if (type === 'ISSUES') {
      detailParam = 'issues';
    } else if (type === 'STAFF') {
      detailParam = 'staff';
    } else if (type === 'VISITORS') {
      detailParam = 'visitors';
    } else if (type === 'INVENTORY') {
      detailParam = 'inventory';
    }

    if (detailParam) {
      try {
        const res = await fetch(`/api/reports?detail=${detailParam}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        if (res.ok) {
          const json = await res.json();
          setModalData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setModalLoading(false);
      }
    } else {
      setModalLoading(false);
    }
  };

  const s = summary || {};
  const totalBuildings = s.totalBuildings ?? 0;
  const totalRooms = s.totalRooms ?? 0;
  const totalBeds = s.totalBeds ?? 0;
  const occupiedBeds = s.occupiedBeds ?? 0;
  const availableBeds = s.availableBeds ?? Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = s.occupancyRate ?? (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);

  const totalTenants = s.totalTenants ?? 0;
  const activeTenants = s.activeTenants ?? 0;
  const newTenantsThisMonth = s.newTenantsThisMonth ?? 0;

  const monthlyCollection = s.monthlyCollection ?? 0;
  const pendingDues = s.pendingDues ?? 0;
  const monthlyExpenses = s.monthlyExpenses ?? 0;
  const netAmount = s.netAmount ?? (monthlyCollection - monthlyExpenses);

  const openComplaints = s.openComplaints ?? 0;
  const activeMaintenance = s.activeMaintenance ?? 0;
  const pendingLeaveRequests = s.pendingLeaveRequests ?? 0;
  const todayVisitors = s.todayVisitors ?? 0;
  const activeVisitors = s.activeVisitors ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#151D2A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-500" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Complete real-time hostel overview & audit metrics from Aiven MySQL
          </p>
        </div>

        <button
          onClick={fetchSummaryData}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* ERROR / RETRY NOTIFICATION */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Unable to load report summary</h4>
              <p className="text-xs text-rose-500 dark:text-rose-400/80">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchSummaryData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* SKELETON LOADER */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800/50" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 2. TOP INTERACTIVE SUMMARY CARDS (CLICKABLE) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            
            {/* BUILDINGS */}
            <div 
              onClick={() => openReportModal('BUILDINGS')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-blue-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">BUILDINGS</span>
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{totalBuildings}</span>
              <span className="text-[10px] text-blue-500 font-bold flex items-center gap-0.5">
                Inspect <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* ROOMS */}
            <div 
              onClick={() => openReportModal('ROOMS')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-violet-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ROOMS</span>
                <DoorClosed className="w-4 h-4 text-violet-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{totalRooms}</span>
              <span className="text-[10px] text-violet-500 font-bold flex items-center gap-0.5">
                Inspect <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* TOTAL BEDS */}
            <div 
              onClick={() => openReportModal('BEDS')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-amber-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL BEDS</span>
                <BedDouble className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{totalBeds}</span>
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                Inspect <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* OCCUPIED BEDS */}
            <div 
              onClick={() => openReportModal('OCCUPIED')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">OCCUPIED</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">{occupiedBeds}</span>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                {occupancyRate}% Rate <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* AVAILABLE BEDS */}
            <div 
              onClick={() => openReportModal('AVAILABLE')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-teal-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">AVAILABLE</span>
                <BedDouble className="w-4 h-4 text-teal-500" />
              </div>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400 block">{availableBeds}</span>
              <span className="text-[10px] text-teal-500 font-bold flex items-center gap-0.5">
                Vacant Spots <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* TOTAL TENANTS */}
            <div 
              onClick={() => openReportModal('TENANTS')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-indigo-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TOTAL TENANTS</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{totalTenants}</span>
              <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-0.5">
                Roster <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* ACTIVE TENANTS */}
            <div 
              onClick={() => openReportModal('TENANTS')}
              className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm cursor-pointer hover:border-cyan-500/50 hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">ACTIVE</span>
                <UserCheck className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 block">{activeTenants}</span>
              <span className="text-[10px] text-cyan-500 font-bold flex items-center gap-0.5">
                +{newTenantsThisMonth} New <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

          </div>

          {/* 3. REPORT SECTIONS & BLOCKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* OCCUPANCY REPORT */}
            <div 
              onClick={() => openReportModal('OCCUPANCY_DETAILS')}
              className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-emerald-500/40 cursor-pointer transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Occupancy Report</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Bed spot allocation status</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  {occupancyRate}%
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 font-bold block">OCCUPIED</span>
                  <span className="font-black text-slate-900 dark:text-white text-base">{occupiedBeds} / {totalBeds}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 font-bold block">AVAILABLE</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{availableBeds}</span>
                </div>
              </div>
            </div>

            {/* FINANCIAL OVERVIEW */}
            <div 
              onClick={() => openReportModal('FINANCIAL')}
              className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-emerald-500/40 cursor-pointer transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Financial Summary</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Collections, dues & expenses</p>
                </div>
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Monthly Collections</span>
                  <span className="font-black text-slate-900 dark:text-white">₹{monthlyCollection.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Pending Dues</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">₹{pendingDues.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10">
                  <span className="font-bold text-rose-600 dark:text-rose-400">Operating Expenses</span>
                  <span className="font-black text-rose-600 dark:text-rose-400">₹{monthlyExpenses.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* TENANT OVERVIEW */}
            <div 
              onClick={() => openReportModal('TENANTS')}
              className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-indigo-500/40 cursor-pointer transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Resident Overview</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Tenant registry status</p>
                </div>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 font-bold block">TOTAL</span>
                  <span className="font-black text-slate-900 dark:text-white text-base">{totalTenants}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-emerald-500 font-bold block">ACTIVE</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{activeTenants}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-blue-500 font-bold block">NEW</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-base">+{newTenantsThisMonth}</span>
                </div>
              </div>
            </div>

            {/* ISSUES & MAINTENANCE */}
            <div 
              onClick={() => openReportModal('ISSUES')}
              className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-amber-500/40 cursor-pointer transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Issues & Maintenance</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Complaints and repair tasks</p>
                </div>
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">OPEN COMPLAINTS</span>
                  <span className="font-black text-amber-600 dark:text-amber-400 text-lg">{openComplaints}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 font-bold block">ACTIVE REPAIRS</span>
                  <span className="font-black text-slate-900 dark:text-white text-lg">{activeMaintenance}</span>
                </div>
              </div>
            </div>

            {/* VISITOR & GATE PASS ACTIVITY */}
            <div 
              onClick={() => openReportModal('VISITORS')}
              className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-cyan-500/40 cursor-pointer transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Visitor Activity</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Gate pass logs & campus entry</p>
                </div>
                <UserCheck className="w-5 h-5 text-cyan-500" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">INSIDE CAMPUS</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{activeVisitors}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 font-bold block">TOTAL VISITORS</span>
                  <span className="font-black text-slate-900 dark:text-white text-lg">{todayVisitors}</span>
                </div>
              </div>
            </div>

            {/* STAFF REPORT */}
            <div 
              onClick={() => openReportModal('STAFF')}
              className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-violet-500/40 cursor-pointer transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Staff & Employees</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Employee roster & pending leaves</p>
                </div>
                <Briefcase className="w-5 h-5 text-violet-500" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 font-bold block">ACTIVE STAFF</span>
                  <span className="font-black text-slate-900 dark:text-white text-lg">{s.activeEmployees ?? 0}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold block">PENDING LEAVES</span>
                  <span className="font-black text-violet-600 dark:text-violet-400 text-lg">{pendingLeaveRequests}</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* 4. ON-DEMAND INTERACTIVE DETAIL MODAL SYSTEM */}
      {activeModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={
            activeModal === 'BUILDINGS' || activeModal === 'ROOMS' || activeModal === 'BEDS' || activeModal === 'OCCUPIED' || activeModal === 'AVAILABLE' || activeModal === 'OCCUPANCY_DETAILS'
              ? 'Occupancy & Property Breakdown'
              : activeModal === 'TENANTS'
              ? 'Resident Directory Report'
              : activeModal === 'FINANCIAL'
              ? 'Financial Statements & Dues Report'
              : activeModal === 'ISSUES'
              ? 'Complaints & Maintenance Log'
              : activeModal === 'STAFF'
              ? 'Staff & Employee Roster'
              : activeModal === 'VISITORS'
              ? 'Gate Passes & Visitor Activity'
              : activeModal === 'INVENTORY'
              ? 'Inventory Stock Report'
              : 'Audit & Activity Log'
          }
          subtitle="Real-time report queried on-demand from Aiven MySQL database."
          size="lg"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left text-xs sm:text-sm max-h-[75vh] overflow-y-auto pr-1">
            
            {/* MODAL SEARCH FILTER */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={modalFilter}
                onChange={(e) => setModalFilter(e.target.value)}
                placeholder="Filter detailed records..."
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* LOADING STATE */}
            {modalLoading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                <p>Querying detailed records from Aiven MySQL...</p>
              </div>
            ) : (
              <>
                {/* OCCUPANCY / PROPERTY HIERARCHY MODAL CONTENT */}
                {(activeModal === 'BUILDINGS' || activeModal === 'ROOMS' || activeModal === 'BEDS' || activeModal === 'OCCUPIED' || activeModal === 'AVAILABLE' || activeModal === 'OCCUPANCY_DETAILS') && (
                  <div className="space-y-4">
                    {modalData?.buildings?.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No properties or rooms configured in database.</div>
                    ) : (
                      modalData?.buildings?.map((b: any) => (
                        <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-500" />
                              <span>{b.name}</span>
                            </h4>
                            <span className="text-xs font-bold text-slate-500">{b.address}</span>
                          </div>

                          {b.floors?.map((f: any) => (
                            <div key={f.id} className="pl-3 border-l-2 border-emerald-500/30 space-y-2">
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Floor {f.number}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {f.rooms?.map((r: any) => (
                                  <div key={r.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-black text-xs text-slate-900 dark:text-white">Room {r.number} ({r.type})</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        r.status === 'OCCUPIED' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                      }`}>
                                        {r.status}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap pt-1">
                                      {r.beds?.map((bed: any) => (
                                        <span key={bed.id} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                          bed.isAvailable ? 'bg-teal-500/10 text-teal-600' : 'bg-amber-500/10 text-amber-600'
                                        }`}>
                                          {bed.number}: {bed.tenantName || (bed.isAvailable ? 'Vacant' : 'Occupied')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TENANT DETAILS MODAL CONTENT */}
                {activeModal === 'TENANTS' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Resident Name</th>
                          <th className="py-2.5 px-3">Room & Bed</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Move-In Date</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {modalData?.tenants?.filter((t: any) => {
                          const name = t.profile ? `${t.profile.firstName} ${t.profile.lastName}` : '';
                          return !modalFilter || name.toLowerCase().includes(modalFilter.toLowerCase()) || (t.roomNumber && t.roomNumber.toLowerCase().includes(modalFilter.toLowerCase()));
                        }).map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                              {t.profile ? `${t.profile.firstName} ${t.profile.lastName}` : 'Resident'}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              Room {t.roomNumber || 'A-101'} · {t.bedNumber || 'Bed A'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                              {t.profile?.phone || '+91 98765 43210'}
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {t.moveInDate ? new Date(t.moveInDate).toISOString().split('T')[0] : 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* FINANCIAL DETAILS MODAL CONTENT */}
                {activeModal === 'FINANCIAL' && (
                  <div className="space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">Recorded Payments & Settled Rent</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Resident</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Method</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {modalData?.payments?.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                                {p.tenant?.profile ? `${p.tenant.profile.firstName} ${p.tenant.profile.lastName}` : 'Resident'}
                              </td>
                              <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">
                                ₹{p.amount?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                                {p.paymentMethod || 'UPI'}
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {p.date ? new Date(p.date).toISOString().split('T')[0] : 'N/A'}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-black text-[10px]">
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ISSUES / COMPLAINTS & MAINTENANCE MODAL CONTENT */}
                {activeModal === 'ISSUES' && (
                  <div className="space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">Complaints Log</h4>
                    <div className="space-y-2">
                      {modalData?.complaints?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No active complaints logged in database.</div>
                      ) : (
                        modalData?.complaints?.map((c: any) => (
                          <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                              <h5 className="font-black text-xs text-slate-900 dark:text-white">{c.title}</h5>
                              <p className="text-[11px] text-slate-500">{c.description} · Category: {c.category}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 font-black text-[10px]">
                              {c.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* STAFF MODAL CONTENT */}
                {activeModal === 'STAFF' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Employee Name</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Monthly Salary</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {modalData?.employees?.length === 0 ? (
                          <tr><td colSpan={5} className="py-6 text-center text-slate-400">No employees registered in database yet.</td></tr>
                        ) : (
                          modalData?.employees?.map((emp: any) => (
                            <tr key={emp.id}>
                              <td className="py-3 px-3 font-black text-slate-900 dark:text-white">{emp.name}</td>
                              <td className="py-3 px-3 font-bold text-violet-600">{emp.role}</td>
                              <td className="py-3 px-3 text-slate-600">{emp.phone}</td>
                              <td className="py-3 px-3 font-black">₹{emp.salary?.toLocaleString('en-IN')}</td>
                              <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-black text-[10px]">{emp.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* VISITORS MODAL CONTENT */}
                {activeModal === 'VISITORS' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Visitor Name</th>
                          <th className="py-2.5 px-3">Person Visiting</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Check-In Schedule</th>
                          <th className="py-2.5 px-3">Gate Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {modalData?.visitors?.length === 0 ? (
                          <tr><td colSpan={5} className="py-6 text-center text-slate-400">No visitor passes recorded yet.</td></tr>
                        ) : (
                          modalData?.visitors?.map((v: any) => (
                            <tr key={v.id}>
                              <td className="py-3 px-3 font-black text-slate-900 dark:text-white">{v.name}</td>
                              <td className="py-3 px-3 font-bold text-cyan-600">{v.personVisiting}</td>
                              <td className="py-3 px-3 text-slate-600">{v.phone}</td>
                              <td className="py-3 px-3 text-slate-500">{v.checkIn ? new Date(v.checkIn).toLocaleString() : 'N/A'}</td>
                              <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-black text-[10px]">{v.approvalStatus}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* INVENTORY MODAL CONTENT */}
                {activeModal === 'INVENTORY' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Quantity</th>
                          <th className="py-2.5 px-3">Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {modalData?.items?.length === 0 ? (
                          <tr><td colSpan={4} className="py-6 text-center text-slate-400">No inventory stock items logged yet.</td></tr>
                        ) : (
                          modalData?.items?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="py-3 px-3 font-black text-slate-900 dark:text-white">{item.name}</td>
                              <td className="py-3 px-3 font-bold text-slate-600">{item.category}</td>
                              <td className="py-3 px-3 font-black">{item.quantity}</td>
                              <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-black text-[10px]">{item.condition}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
