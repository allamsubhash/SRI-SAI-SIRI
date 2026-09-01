'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Plus, 
  Loader, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wifi, 
  Flame, 
  Sparkles, 
  Coffee, 
  Home, 
  ShieldAlert, 
  Search,
  Check
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatDate } from '@/utils/formatters';

export default function TenantComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('WIFI');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTenantComplaints = () => {
    setLoading(true);
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((c: any) => 
          (c.tenantName && user?.name && c.tenantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (c.tenantId && user?.id && c.tenantId === user.id)
        );
        setComplaints(filtered.length > 0 ? filtered : data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchTenantComplaints();
    }
  }, [user]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user?.id || 'tenant-id-fallback',
          title,
          description,
          category
        })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setCategory('WIFI');
        setShowModal(false);
        fetchTenantComplaints();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'PENDING') return c.status === 'PENDING' || c.status === 'Open';
      if (activeTab === 'IN_PROGRESS') return c.status === 'IN_PROGRESS' || c.status === 'Assigned' || c.status === 'In Progress';
      if (activeTab === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'Resolved';
      return true;
    });
  }, [complaints, activeTab]);

  const activeCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'Resolved').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'Resolved').length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-44 bg-[#FFFDF9]/80 dark:bg-[#141D19]/80 rounded-[32px] border border-white/80 dark:border-[#293832]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      
      {/* 👑 1. HERO SERVICE DESK BANNER */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border border-amber-200 dark:border-[#F2C15D]/30 flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3 h-3 text-amber-400" />
            SERVICE DESK & MAINTENANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            My Maintenance Complaints
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Report room maintenance issues, Wi-Fi connectivity, or mess dining tickets to warden staff.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-3.5 px-7 rounded-2xl tenant-bg-accent font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0 z-10"
        >
          <Plus className="w-4 h-4" />
          <span>+ File Support Ticket</span>
        </button>
      </motion.div>

      {/* 📊 2. KPI STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-black uppercase tracking-wider">Active Tickets</span>
            <div className="text-3xl font-black text-[#B7791F] dark:text-[#F2C15D]">{activeCount} Pending</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">Tickets currently being processed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] flex items-center justify-center font-black shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-black uppercase tracking-wider">Resolved Log</span>
            <div className="text-3xl font-black tenant-text-accent">{resolvedCount} Completed</div>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">Successfully resolved tickets</p>
          </div>
          <div className="w-12 h-12 rounded-2xl tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center justify-center font-black shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* 🔍 3. TABS FILTER TOOLBAR */}
      <div className="p-2.5 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Tickets' },
          { id: 'PENDING', label: 'Active / Pending' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'RESOLVED', label: 'Resolved' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'tenant-bg-accent shadow-md'
                : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2] hover:bg-[#F1EEE7] dark:hover:bg-[#1A2621]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📋 4. COMPLAINTS LIST */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 rounded-[32px] border border-white/80 dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] space-y-3 shadow-xl backdrop-blur-2xl">
            <CheckCircle2 className="w-10 h-10 tenant-text-accent mx-auto" />
            <p className="text-sm font-black text-[#1C2522] dark:text-[#F2F5F2]">Everything looks good!</p>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">No maintenance complaints match the selected filter tab.</p>
            <button
              onClick={() => setShowModal(true)}
              className="py-2.5 px-6 rounded-2xl tenant-bg-accent text-xs font-black shadow-md cursor-pointer"
            >
              File Support Ticket
            </button>
          </div>
        ) : (
          filteredComplaints.map((c) => (
            <motion.div 
              whileHover={{ y: -2 }}
              key={c.id}
              className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4 text-left hover:tenant-border-accent transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
                      {c.category}
                    </span>
                    <span className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-bold">Ticket #{c.id}</span>
                  </div>
                  <h3 className="font-black text-base text-[#1C2522] dark:text-[#F2F5F2] mt-1.5">{c.title}</h3>
                </div>

                <span className={`text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                  c.status === 'RESOLVED' || c.status === 'Resolved' ? 'tenant-bg-soft tenant-text-accent tenant-border-accent' :
                  c.status === 'IN_PROGRESS' || c.status === 'In Progress' ? 'bg-[#B58A3A]/10 dark:bg-[#D7B568]/15 text-[#B58A3A] dark:text-[#D7B568] border-[#B58A3A]/20 dark:border-[#D7B568]/30' :
                  'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border-amber-200 dark:border-[#F2C15D]/30'
                }`}>
                  {c.status}
                </span>
              </div>

              <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] leading-relaxed bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 p-4.5 rounded-2xl border border-[#DDD8CE] dark:border-[#293832] font-medium">
                {c.description}
              </p>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-[#68736E] dark:text-[#9BAAA4] pt-2 border-t border-[#DDD8CE] dark:border-[#293832] font-medium">
                <span>Assigned Staff: <strong className="text-[#1C2522] dark:text-[#F2F5F2]">{c.assignedEmployeeName || 'Warden Maintenance Desk'}</strong></span>
                <span>Reported Date: {formatDate(c.dateCreated || c.createdAt)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 🚀 FILE COMPLAINT MODAL */}
      {showModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="File Support Ticket"
          subtitle="Report a maintenance issue to hostel wardens."
          size="md"
          accentColor="emerald"
        >
          <form onSubmit={handleSubmitComplaint} className="space-y-4 text-left font-sans">
            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              >
                <option value="WIFI">Wi-Fi & Internet</option>
                <option value="PLUMBING">Plumbing / Water Tap</option>
                <option value="ELECTRICAL">AC & Electrical Repairs</option>
                <option value="CLEANING">Housekeeping & Cleaning</option>
                <option value="FOOD">Mess Dining & Food</option>
                <option value="OTHER">Other General Complaint</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Complaint Summary Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AC unit not cooling properly in Room A-101"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Full Description Details</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the issue..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div className="pt-3 border-t border-[#DDD8CE] dark:border-[#293832] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] font-bold text-xs cursor-pointer border border-[#DDD8CE] dark:border-[#293832]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-6 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer disabled:opacity-50 shadow-md"
              >
                {submitting ? 'Submitting...' : 'Submit Ticket ✓'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

    </motion.div>
  );
}
