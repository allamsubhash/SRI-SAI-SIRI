'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  DoorClosed, 
  BedDouble, 
  UserCheck, 
  Users, 
  Wallet, 
  Clock, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Wrench, 
  FileText, 
  RefreshCw, 
  Plus, 
  Search,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function OwnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/dashboard', {
        headers: { 'Cache-Control': 'no-store' }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load dashboard`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Dashboard Fetch Error:', err);
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics || {};
  const recentActivities = data?.recentActivities || [];

  // Safe numerical extractions
  const totalBuildings = metrics.totalBuildings ?? metrics.buildings ?? 0;
  const totalRooms = metrics.totalRooms ?? metrics.rooms ?? 0;
  const totalBeds = metrics.totalBeds ?? metrics.beds ?? 0;
  const occupiedBeds = metrics.occupiedBeds ?? 0;
  const availableBeds = metrics.availableBeds ?? metrics.vacantBeds ?? Math.max(0, totalBeds - occupiedBeds);
  const occupancyPercentage = metrics.occupancyPercentage ?? metrics.occupancyRate ?? (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);

  const monthlyCollection = metrics.monthlyCollection ?? metrics.monthlyIncome ?? 0;
  const pendingDues = metrics.pendingDues ?? metrics.pendingRent ?? 0;
  const monthlyExpenses = metrics.monthlyExpenses ?? 0;

  const totalTenants = metrics.totalTenants ?? metrics.tenants ?? 0;
  const activeTenants = metrics.activeTenants ?? metrics.tenants ?? 0;
  const newTenantsThisMonth = metrics.newTenantsThisMonth ?? 0;

  const pendingComplaints = metrics.pendingComplaints ?? 0;
  const activeMaintenance = metrics.activeMaintenance ?? 0;
  const pendingLeaveRequests = metrics.pendingLeaveRequests ?? 0;
  const unpaidInvoices = metrics.unpaidInvoicesCount ?? 0;

  const attentionRequiredCount = unpaidInvoices + pendingComplaints + activeMaintenance + pendingLeaveRequests;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors">
      
      {/* 1. TOP HEADER & GREETING */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#151D2A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Good Morning, <span className="text-emerald-600 dark:text-emerald-400">Admin</span> 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening in your hostel today.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* SEARCH BAR */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resident, room..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* MANUAL REFRESH BUTTON */}
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ERROR / RETRY STATE */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Unable to load dashboard data</h4>
              <p className="text-xs text-rose-500 dark:text-rose-400/80">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* SKELETON LOADER STATE */}
      {loading && !error ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-44 lg:col-span-1 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
            <div className="h-44 lg:col-span-2 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1 — KEY STATISTICS (4 CARDS) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* TOTAL BUILDINGS */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">BUILDINGS</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalBuildings}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Configured properties</span>
              </div>
            </div>

            {/* TOTAL ROOMS */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">ROOMS</span>
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                  <DoorClosed className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalRooms}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Active hostel rooms</span>
              </div>
            </div>

            {/* TOTAL BEDS */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">TOTAL BEDS</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <BedDouble className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalBeds}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Total capacity</span>
              </div>
            </div>

            {/* OCCUPIED BEDS */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">OCCUPIED BEDS</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{occupiedBeds}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">{occupancyPercentage}% Occupancy</span>
              </div>
            </div>

          </div>

          {/* SECTION 2 & SECTION 3 — OCCUPANCY & FINANCIAL SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SECTION 2 — OCCUPANCY CARD */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Hostel Occupancy</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Bed spot allocation status</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  {occupancyPercentage}%
                </div>
              </div>

              {totalBeds === 0 ? (
                <div className="py-6 text-center text-xs font-bold text-slate-400 space-y-1">
                  <p className="text-slate-900 dark:text-white font-black">0%</p>
                  <p>No beds configured yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* PROGRESS BAR */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, occupancyPercentage))}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OCCUPIED BEDS</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{occupiedBeds} / {totalBeds}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AVAILABLE BEDS</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{availableBeds}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3 — FINANCIAL SUMMARY (3 CARDS IN 2-COL GRID) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Financial Summary</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Current month revenue, dues & operating expenses</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* MONTHLY COLLECTION */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">MONTHLY COLLECTION</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{monthlyCollection.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Settled rent payments</p>
                </div>

                {/* PENDING DUES */}
                <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">PENDING DUES</span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    ₹{pendingDues.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/80 font-bold">Unpaid rent balances</p>
                </div>

                {/* TOTAL EXPENSES */}
                <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">TOTAL EXPENSES</span>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    ₹{monthlyExpenses.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400/80 font-bold">Utilities & maintenance</p>
                </div>

              </div>
            </div>

          </div>

          {/* SECTION 4 & SECTION 5 — TENANT SUMMARY & ATTENTION REQUIRED */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SECTION 4 — TENANT SUMMARY */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Resident Overview</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Active hostel resident counts</p>
                </div>
                <Link 
                  href="/owner/tenants" 
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Manage Residents <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{totalTenants}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">ACTIVE</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{activeTenants}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">NEW THIS MONTH</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">+{newTenantsThisMonth}</span>
                </div>
              </div>
            </div>

            {/* SECTION 5 — ATTENTION REQUIRED */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Attention Required</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Pending operational items requiring approval or action</p>
                </div>
                {attentionRequiredCount > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs">
                    {attentionRequiredCount} Pending
                  </span>
                )}
              </div>

              {attentionRequiredCount === 0 ? (
                <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-black text-sm text-slate-900 dark:text-white">Everything looks good</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">No pending actions requiring immediate attention.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/owner/rent" className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-amber-500/40 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PENDING INVOICES</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{unpaidInvoices} Invoice{unpaidInvoices === 1 ? '' : 's'}</span>
                  </Link>

                  <Link href="/owner/complaints" className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-rose-500/40 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OPEN COMPLAINTS</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">{pendingComplaints} Ticket{pendingComplaints === 1 ? '' : 's'}</span>
                  </Link>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE MAINTENANCE</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{activeMaintenance} Task{activeMaintenance === 1 ? '' : 's'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PENDING LEAVES</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{pendingLeaveRequests} Request{pendingLeaveRequests === 1 ? '' : 's'}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* SECTION 6 — RECENT ACTIVITY */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#151D2A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Recent Hostel Activity</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Live audit updates from resident registrations, payments, and tickets</p>
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 space-y-1">
                <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-slate-700 dark:text-slate-300 font-bold">No recent activity</p>
                <p>Activity log will populate automatically as hostel tasks occur.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentActivities.map((act: any) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        act.type === 'TENANT' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        act.type === 'PAYMENT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {act.type === 'TENANT' ? <Users className="w-4 h-4" /> :
                         act.type === 'PAYMENT' ? <Wallet className="w-4 h-4" /> :
                         <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white">{act.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{act.desc}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
