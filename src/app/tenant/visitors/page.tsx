'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Plus, Loader, Clock, CheckCircle2, Search, Sparkles } from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatDate } from '@/utils/formatters';

export default function TenantVisitors() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0] + 'T12:00');
  const [submitting, setSubmitting] = useState(false);

  const fetchTenantVisitors = () => {
    setLoading(true);
    fetch('/api/visitors')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((v: any) => 
          (v.tenantName && user?.name && v.tenantName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (v.personVisiting && user?.name && v.personVisiting.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (v.tenantId && user?.id && v.tenantId === user.id)
        );
        setVisitors(filtered.length > 0 ? filtered : data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchTenantVisitors();
    }
  }, [user]);

  const handleSubmitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !checkIn || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user?.id || 'tenant-id-fallback',
          name,
          phone,
          personVisiting: user?.name || 'Resident',
          checkIn
        })
      });
      if (res.ok) {
        setName('');
        setPhone('');
        setShowModal(false);
        fetchTenantVisitors();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

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
      
      {/* 👑 1. HERO GATE PASS BANNER */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            SECURITY GATE PASS SYSTEM
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            Visitor Pre-Approvals
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Pre-register family, friends, or delivery guests for seamless biometric gate entry.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-3.5 px-7 rounded-2xl tenant-bg-accent font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0 z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Pre-Register Guest</span>
        </button>
      </motion.div>

      {/* 📜 2. VISITOR PASS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visitors.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 rounded-[32px] border border-white/80 dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] space-y-3 shadow-xl backdrop-blur-2xl">
            <UserCheck className="w-10 h-10 text-[#929B96] mx-auto opacity-50" />
            <p className="text-sm font-black text-[#1C2522] dark:text-[#F2F5F2]">No visitor entry requests</p>
            <p className="text-xs text-[#68736E] dark:text-[#9BAAA4]">Pre-register your guests to issue digital entrance passes.</p>
            <button
              onClick={() => setShowModal(true)}
              className="py-2.5 px-6 rounded-2xl tenant-bg-accent text-xs font-black shadow-md cursor-pointer"
            >
              Pre-Register Guest
            </button>
          </div>
        ) : (
          visitors.map((v) => {
            const status = v.status || v.approvalStatus || 'APPROVED';
            const isApproved = status === 'APPROVED';
            const isPending = status === 'PENDING';
            return (
              <motion.div 
                whileHover={{ y: -3, scale: 1.01 }}
                key={v.id} 
                className="p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl space-y-4 text-left hover:tenant-border-accent transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl tenant-bg-accent font-black flex items-center justify-center text-base shadow-md shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#1C2522] dark:text-[#F2F5F2] text-base">{v.name}</h3>
                      <span className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-bold block mt-0.5">📞 {v.phone}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                    isApproved ? 'tenant-bg-soft tenant-text-accent tenant-border-accent' :
                    isPending ? 'bg-amber-50 dark:bg-[#F2C15D]/15 text-[#B7791F] dark:text-[#F2C15D] border-amber-200 dark:border-[#F2C15D]/30' :
                    'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border-rose-200 dark:border-[#F27676]/30'
                  }`}>
                    {status}
                  </span>
                </div>

                <div className="space-y-2 bg-[#F1EEE7]/90 dark:bg-[#1A2621]/90 p-4.5 rounded-2xl border border-[#DDD8CE] dark:border-[#293832] text-xs font-bold text-[#68736E] dark:text-[#9BAAA4]">
                  <div className="flex justify-between">
                    <span>Scheduled Arrival:</span>
                    <span className="text-[#1C2522] dark:text-[#F2F5F2]">{v.checkIn || 'Today, 12:00 PM'}</span>
                  </div>
                  {v.checkOut && (
                    <div className="flex justify-between pt-1 border-t border-[#DDD8CE] dark:border-[#293832]">
                      <span>Gate Exit:</span>
                      <span className="text-[#68736E] dark:text-[#9BAAA4]">{v.checkOut}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 📝 REGISTER VISITOR MODAL */}
      {showModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Pre-Register Guest Gate Pass"
          subtitle="File a pre-approval request for your visitor to enter the hostel main gate."
          size="sm"
          accentColor="emerald"
        >
          <form onSubmit={handleSubmitVisitor} className="space-y-4 text-left font-sans">
            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Guest Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Guest Contact Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] text-xs font-bold text-[#1C2522] dark:text-[#F2F5F2]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#68736E] dark:text-[#9BAAA4] block mb-1">Scheduled Arrival Date & Time</label>
              <input
                type="datetime-local"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
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
                {submitting ? 'Registering...' : 'Issue Gate Pass ✓'}
              </button>
            </div>
          </form>
        </NeonModal>
      )}

    </motion.div>
  );
}
