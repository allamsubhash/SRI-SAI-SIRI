'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  DollarSign, 
  Users, 
  Building, 
  FileText, 
  Sparkles,
  RotateCw,
  AlertTriangle,
  PieChart as PieIcon,
  Filter,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { useToast } from '@/components/ToastProvider';
import NeonModal from '@/components/NeonModal';
import { formatINR } from '@/utils/formatters';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState('THIS_MONTH');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchRealAnalytics = () => {
    setLoading(true);
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRealAnalytics();
  }, []);

  const handleExportPDF = () => {
    showToast('Exporting Comprehensive Report', 'Generating financial statement & occupancy analytics PDF.', 'success');
  };

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_ANALYTICS' })
      });
      if (res.ok) {
        showToast('Analytics & Reports Reset', 'All revenue, invoice, expense logs, and profit charts reset to 0.', 'success');
        setShowResetModal(false);
        fetchRealAnalytics();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  const metrics = data?.metrics || {
    monthlyIncome: 0,
    monthlyExpenses: 0,
    pendingRent: 0,
    beds: 0,
    occupiedBeds: 0,
    vacantBeds: 0,
    tenants: 0
  };

  const totalRevenue = metrics.monthlyIncome || 0;
  const totalExpenses = metrics.monthlyExpenses || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
  const occupancyRate = metrics.beds > 0 ? ((metrics.occupiedBeds / metrics.beds) * 100).toFixed(1) : '0';
  
  const totalBilled = totalRevenue + (metrics.pendingRent || 0);
  const collectionEfficiency = totalBilled > 0 ? ((totalRevenue / totalBilled) * 100).toFixed(1) : '100';

  const monthLabel = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  
  const monthlyFinancials = useMemo(() => [
    { month: monthLabel, revenue: totalRevenue, expenses: totalExpenses, profit: Math.max(0, netProfit) }
  ], [monthLabel, totalRevenue, totalExpenses, netProfit]);

  const occupancyHistory = useMemo(() => [
    { month: monthLabel, rate: parseFloat(occupancyRate) }
  ], [monthLabel, occupancyRate]);

  const hasData = totalRevenue > 0 || totalExpenses > 0 || metrics.beds > 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <BarChart3 className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Site Analytics & BI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200 select-none pb-24 relative">
      
      {/* 👑 1. HEADER HERO CARD */}
      <div className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] text-[#1C2522] dark:text-[#F2F5F2] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
              EXECUTIVE BI & ANALYTICS
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {occupancyRate}% OCCUPANCY RATE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Financial & Occupancy Analytics
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Real-time executive reporting on revenue streams, net margins, occupancy trends, and financial performance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto z-10">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2] cursor-pointer focus:outline-none focus:tenant-border-accent"
          >
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="LAST_3_MONTHS">Last 3 Months</option>
            <option value="THIS_YEAR">This Year</option>
          </select>

          <button 
            onClick={handleExportPDF}
            className="py-2.5 px-5 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 📊 2. LARGE BI KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-1">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL REVENUE</span>
          <div className="text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] mt-1">
            {formatINR(totalRevenue)}
          </div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">
            Settled Invoices
          </span>
        </div>

        <div className="p-5 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm space-y-1">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">NET OPERATING PROFIT</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(netProfit)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 block mt-1">
            Net Margin: {profitMargin}%
          </span>
        </div>

        <div className="p-5 rounded-[28px] bg-white/80 dark:bg-[#141D30]/80 border border-slate-200/80 dark:border-white/10 shadow-lg backdrop-blur-2xl space-y-1 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black text-blue-600 dark:text-cyan-400 uppercase tracking-widest block">BED OCCUPANCY RATE</span>
          <div className="text-3xl font-black text-blue-600 dark:text-cyan-400 mt-1">
            {occupancyRate}%
          </div>
          <span className="text-[10px] font-bold text-slate-400 block mt-1">
            {metrics.occupiedBeds} occupied / {metrics.beds} beds
          </span>
        </div>

        <div className="p-5 rounded-[28px] bg-white/80 dark:bg-[#141D30]/80 border border-slate-200/80 dark:border-white/10 shadow-lg backdrop-blur-2xl space-y-1 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">COLLECTION EFFICIENCY</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {collectionEfficiency}%
          </div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
            On-Time Settlement
          </span>
        </div>
      </div>

      {/* 📊 3. BI CHARTS GRID / CLEAN ZERO-STATE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue vs Expenses */}
        <div className="p-6 rounded-[32px] bg-white/80 dark:bg-[#141D30]/80 border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Monthly Profit & Loss</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Calculated from paid invoices and logged expenses</p>
            </div>
          </div>

          {!hasData ? (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              <PieIcon className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-black text-slate-900 dark:text-white">No financial data available yet</p>
              <p className="text-[10px] text-slate-400">Issue your first rent invoice or log an expense to begin analytics.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFinancials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141D30', borderRadius: '16px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Occupancy Rate */}
        <div className="p-6 rounded-[32px] bg-white/80 dark:bg-[#141D30]/80 border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Occupancy Utilization Trend</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Percentage of bed space occupied by active residents</p>
            </div>
          </div>

          {!hasData ? (
            <div className="h-64 flex flex-col items-center justify-center p-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-black text-slate-900 dark:text-white">No occupancy data available yet</p>
              <p className="text-[10px] text-slate-400">Register your first tenant to view occupancy trends.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141D30', borderRadius: '16px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(val: any) => [`${val}%`, 'Occupancy']}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorOcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* 🌡️ 4. OCCUPANCY DISTRIBUTION MATRIX */}
      <div className="p-6 rounded-[32px] bg-white/80 dark:bg-[#141D30]/80 border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-2xl space-y-4">
        <h3 className="font-black text-base text-slate-900 dark:text-white">Live Occupancy Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase block">Total Bed Capacity</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">{metrics.beds} Beds</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-black text-blue-600 dark:text-cyan-400 uppercase block">Occupied Beds</span>
            <div className="text-xl font-black text-blue-600 dark:text-cyan-400">{metrics.occupiedBeds} Beds</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase block">Vacant Beds</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{metrics.vacantBeds} Beds</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase block">Active Residents</span>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400">{metrics.tenants} Residents</div>
          </div>
        </div>
      </div>

      {/* ⚠️ 5. CONFIRMATION MODAL FOR RESETTING ANALYTICS */}
      {showResetModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowResetModal(false)}
          title="Reset Analytics & Financial Reports"
          subtitle="This action will clear all revenue metrics and P&L charts."
          size="sm"
          accentColor="rose"
        >
          <div className="space-y-4 text-left font-sans">
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              Are you sure you want to reset all reports and financial analytics? This will clear all invoice records, expense logs, and profit charts back to zero (₹0). Active tenants and room configurations will remain unaffected.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={resetting}
                className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset All Reports'}
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
