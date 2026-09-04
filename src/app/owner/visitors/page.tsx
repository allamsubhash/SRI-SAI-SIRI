'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  Filter, 
  Loader, 
  AlertCircle, 
  LogOut, 
  LogIn, 
  Building, 
  User, 
  Phone, 
  Calendar,
  Sparkles
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatDate } from '@/utils/formatters';

export default function OwnerVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'CHECKED_OUT'>('ALL');
  
  // Modal for manual gate pass entry by owner
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInTime, setCheckInTime] = useState(new Date().toISOString().split('T')[0] + 'T12:00');
  const [submitting, setSubmitting] = useState(false);

  const fetchVisitors = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/visitors').then(res => res.json()),
      fetch('/api/tenants').then(res => res.json())
    ])
      .then(([vData, tData]) => {
        setVisitors(Array.isArray(vData) ? vData : []);
        setTenants(Array.isArray(tData) ? tData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleUpdateStatus = async (visitorId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/visitors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: visitorId, status: newStatus })
      });
      if (res.ok) {
        fetchVisitors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !checkInTime || submitting) return;

    setSubmitting(true);
    try {
      const targetTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];
      const tenantName = targetTenant ? (targetTenant.name || `${targetTenant.profile?.firstName} ${targetTenant.profile?.lastName}`) : 'Resident';

      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: targetTenant?.id || 'manual-entry',
          name: guestName,
          phone: guestPhone,
          personVisiting: tenantName,
          checkIn: checkInTime
        })
      });

      if (res.ok) {
        setGuestName('');
        setGuestPhone('');
        setShowCreateModal(false);
        fetchVisitors();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const status = v.status || v.approvalStatus || 'APPROVED';
      const matchesSearch = search === '' ||
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.phone?.toLowerCase().includes(search.toLowerCase()) ||
        v.personVisiting?.toLowerCase().includes(search.toLowerCase()) ||
        v.tenantName?.toLowerCase().includes(search.toLowerCase());

      const matchesTab = activeTab === 'ALL' ||
        (activeTab === 'PENDING' && (status === 'PENDING' || status === 'Pending')) ||
        (activeTab === 'APPROVED' && (status === 'APPROVED' || status === 'Approved')) ||
        (activeTab === 'CHECKED_IN' && status === 'CHECKED_IN') ||
        (activeTab === 'CHECKED_OUT' && status === 'CHECKED_OUT');

      return matchesSearch && matchesTab;
    });
  }, [visitors, search, activeTab]);

  const pendingCount = visitors.filter(v => (v.status || v.approvalStatus) === 'PENDING' || (v.status || v.approvalStatus) === 'Pending').length;
  const checkedInCount = visitors.filter(v => (v.status || v.approvalStatus) === 'CHECKED_IN').length;
  const approvedCount = visitors.filter(v => (v.status || v.approvalStatus) === 'APPROVED' || (v.status || v.approvalStatus) === 'Approved').length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
          <div className="h-32 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[28px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-7 text-left font-sans transition-colors duration-200"
    >
      
      {/* 👑 1. HERO GATE PASS BANNER */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            SECURITY GATE PASS SYSTEM
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tenant Visitor Approvals & Entry Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Approve tenant guest gate pass requests, monitor biometric check-ins, and track hostel visitor logs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-2 shrink-0 z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Gate Pass</span>
        </button>
      </motion.div>

      {/* 📊 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider">Pending Approvals</span>
            <div className="text-3xl font-black text-amber-500">{pendingCount} Requests</div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Awaiting Owner/Warden decision</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black shadow-sm">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider">Checked-In Inside</span>
            <div className="text-3xl font-black text-emerald-400">{checkedInCount} Guests</div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Currently inside hostel premises</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider">Approved Passes</span>
            <div className="text-3xl font-black text-cyan-400">{approvedCount} Issued</div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Ready for gate arrival</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-black shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* 🔍 3. SEARCH & TABS FILTER BAR */}
      <div className="p-4 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#101916] border border-slate-200 dark:border-[#30423A] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            placeholder="Search visitor name, phone, or resident..."
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Passes' },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'CHECKED_IN', label: 'Checked In' },
            { id: 'CHECKED_OUT', label: 'Checked Out' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-[#1A2621] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📜 4. GATE PASS LIST & ACTION BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredVisitors.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 rounded-[32px] border border-white/80 dark:border-[#293832] text-slate-500 dark:text-zinc-400 space-y-3 shadow-xl backdrop-blur-2xl">
            <UserCheck className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
            <p className="text-sm font-black text-slate-900 dark:text-white">No visitor gate passes found</p>
            <p className="text-xs">No tenant visitor entry requests match your current search filters.</p>
          </div>
        ) : (
          filteredVisitors.map((v) => {
            const status = v.status || v.approvalStatus || 'APPROVED';
            const isPending = status === 'PENDING' || status === 'Pending';
            const isApproved = status === 'APPROVED' || status === 'Approved';
            const isCheckedIn = status === 'CHECKED_IN';
            const isCheckedOut = status === 'CHECKED_OUT';
            const isRejected = status === 'REJECTED' || status === 'Rejected';

            return (
              <motion.div 
                whileHover={{ y: -3, scale: 1.01 }}
                key={v.id} 
                className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4 text-left hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-400 font-black flex items-center justify-center text-base shadow-sm shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-base">{v.name}</h3>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold block mt-0.5">📞 {v.phone}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                      isCheckedIn ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      isApproved ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                      isPending ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse' :
                      isCheckedOut ? 'bg-slate-500/15 text-slate-400 border-slate-500/30' :
                      'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {status}
                    </span>
                  </div>

                  <div className="space-y-2 bg-slate-50/90 dark:bg-[#1A2621]/90 p-4 rounded-2xl border border-slate-200 dark:border-[#293832] text-xs font-bold text-slate-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resident Host:</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{v.personVisiting || v.tenantName || 'Resident'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-[#293832]">
                      <span className="text-slate-400">Scheduled Check-In:</span>
                      <span className="text-slate-900 dark:text-white">{v.checkIn || 'Today, 12:00 PM'}</span>
                    </div>
                    {v.checkOut && (
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-[#293832]">
                        <span className="text-slate-400">Gate Exit Time:</span>
                        <span className="text-slate-500">{v.checkOut}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔘 ACTION BUTTONS FOR OWNER/WARDEN */}
                <div className="pt-3 border-t border-slate-200 dark:border-[#293832] flex flex-wrap gap-2 justify-end">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(v.id, 'REJECTED')}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-xs border border-rose-500/20 transition-all cursor-pointer"
                      >
                        Reject ✗
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(v.id, 'APPROVED')}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
                      >
                        APPROVE GATE PASS ✓
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => handleUpdateStatus(v.id, 'CHECKED_IN')}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>MARK CHECK-IN 🚪</span>
                    </button>
                  )}

                  {isCheckedIn && (
                    <button
                      onClick={() => handleUpdateStatus(v.id, 'CHECKED_OUT')}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>MARK CHECK-OUT 🏁</span>
                    </button>
                  )}

                  {(isCheckedOut || isRejected) && (
                    <span className="text-[11px] font-bold text-slate-400 italic">No further actions required</span>
                  )}
                </div>

              </motion.div>
            );
          })
        )}
      </div>

      {/* 📝 ISSUE MANUAL GATE PASS MODAL */}
      {showCreateModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Issue Digital Visitor Gate Pass"
          subtitle="Generate a pre-approved gate entrance pass for a resident guest."
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleCreateGatePass} className="space-y-4 text-left font-sans">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Select Resident Host</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-slate-200 dark:border-[#30423A] text-xs font-bold text-slate-900 dark:text-white"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name || `${t.profile?.firstName} ${t.profile?.lastName}`} (Room {t.roomNumber || 'A-101'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-slate-200 dark:border-[#30423A] text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Guest Contact Phone</label>
                <input
                  type="text"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-slate-200 dark:border-[#30423A] text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">Scheduled Arrival Time</label>
              <input
                type="datetime-local"
                required
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-slate-200 dark:border-[#30423A] text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#293832] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-[#1A2621] text-slate-600 dark:text-zinc-400 font-bold text-xs cursor-pointer border border-slate-200 dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-6 rounded-2xl bg-indigo-600 text-white font-black text-xs cursor-pointer shadow-md hover:bg-indigo-700"
              >
                {submitting ? 'Generating...' : 'Issue Gate Pass ✓'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

    </motion.div>
  );
}
