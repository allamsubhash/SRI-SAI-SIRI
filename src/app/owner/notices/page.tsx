'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  Plus, 
  Loader, 
  BellRing, 
  Sparkles, 
  Trash2, 
  ShieldAlert, 
  Users, 
  Building,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { useToast } from '@/components/ToastProvider';
import { formatDate } from '@/utils/formatters';

export default function NoticesManagement() {
  const { showToast } = useToast();
  
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedViewNotice, setSelectedViewNotice] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState('ALL');
  const [isEmergency, setIsEmergency] = useState(false);

  // Filter Tab
  const [targetFilter, setTargetFilter] = useState('ALL');

  const fetchNotices = () => {
    setLoading(true);
    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        setNotices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, target, isEmergency })
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        setIsEmergency(false);
        setShowModal(false);
        showToast('Announcement Published', `Notice broadcasted to ${target} recipients.`, 'success');
        fetchNotices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      const res = await fetch('/api/notices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedViewNotice(null);
        showToast('Notice Deleted', 'Announcement removed from active bulletin board.', 'info');
        fetchNotices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      if (targetFilter === 'ALL') return true;
      if (targetFilter === 'EMERGENCY') return n.isEmergency;
      return n.target === targetFilter;
    });
  }, [notices, targetFilter]);

  const totalNotices = notices.length;
  const emergencyNoticesCount = useMemo(() => notices.filter(n => n.isEmergency).length, [notices]);
  const activeNoticesCount = totalNotices;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Notice Bulletin Board...</span>
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
              COMMUNICATION & BULLETIN BOARD
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold tenant-text-accent tenant-bg-soft px-3 py-1 rounded-full border tenant-border-accent">
              <span className="w-1.5 h-1.5 rounded-full tenant-bg-accent-raw animate-pulse" />
              {activeNoticesCount} ACTIVE BROADCASTS
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C2522] dark:text-[#F2F5F2] group-hover:tenant-text-accent transition-colors">
            Warden Broadcast & Notices
          </h1>
          
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Broadcast hostel notices, curfew updates, dining mess changes, and emergency alerts to resident portals.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-3 px-6 rounded-2xl tenant-bg-accent text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer shrink-0 z-10"
        >
          <Plus className="w-4 h-4" />
          <span>+ Broadcast Notice</span>
        </button>
      </div>

      {/* 📊 2. METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-[#68736E] dark:text-[#9BAAA4] uppercase tracking-widest block">TOTAL ANNOUNCEMENTS</span>
          <div className="text-2xl font-black text-[#1C2522] dark:text-[#F2F5F2] mt-1">{totalNotices} Notices</div>
          <span className="text-[10px] font-extrabold tenant-text-accent block mt-1">Broadcasted</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">ACTIVE ON BULLETIN</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeNoticesCount} Active</div>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">Visible to Residents</span>
        </div>

        <div className="p-4 rounded-[24px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm">
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest block">EMERGENCY ALERTS</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{emergencyNoticesCount} Alerts</div>
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 block mt-1">High Priority</span>
        </div>
      </div>

      {/* 🔍 3. FILTER TABS */}
      <div className="p-2 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Notices' },
          { id: 'EMERGENCY', label: 'Emergency Alerts' },
          { id: 'BUILDING_A', label: 'Main Campus Building' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTargetFilter(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              targetFilter === tab.id 
                ? 'tenant-bg-accent text-white shadow-sm' 
                : 'text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📋 4. NOTICES GRID / EMPTY STATE */}
      {filteredNotices.length === 0 ? (
        <div className="p-12 text-center bg-white/80 dark:bg-[#141D30]/80 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xl space-y-3">
          <Megaphone className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-black text-slate-900 dark:text-white">No notices broadcasted yet</p>
          <p className="text-xs text-slate-400">Publish your first announcement to inform residents across all hostel blocks.</p>
          <button
            onClick={() => setShowModal(true)}
            className="py-2.5 px-5 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            Broadcast Announcement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotices.map((notice) => (
            <motion.div 
              key={notice.id} 
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedViewNotice(notice)}
              className={`p-6 rounded-[28px] border backdrop-blur-2xl text-left space-y-4 cursor-pointer hover:border-blue-500/40 transition-all ${
                notice.isEmergency 
                  ? 'bg-rose-500/10 dark:bg-rose-500/10 border-rose-500/30' 
                  : 'bg-[#FDFBF9]/95 dark:bg-[#141D30]/95 border-white/80 dark:border-white/10 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                  notice.isEmergency ? 'bg-rose-500 text-white shadow-xs' : 'bg-blue-500/15 text-blue-600 dark:text-cyan-400'
                }`}>
                  {notice.isEmergency ? 'EMERGENCY BROADCAST' : `Target: ${notice.target}`}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold">{formatDate(notice.createdAt)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteNotice(notice);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  {notice.isEmergency && <BellRing className="w-4 h-4 text-rose-500 animate-bounce" />}
                  {notice.title}
                </h3>
                <p className="text-slate-500 dark:text-zinc-400 text-xs mt-2 leading-relaxed font-medium line-clamp-3">
                  {notice.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🚀 5. PUBLISH ANNOUNCEMENT MODAL */}
      {showModal && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Publish Announcement"
          subtitle="Create a broadcast notice sent to tenant portals."
          size="md"
          accentColor="purple"
        >
          <form onSubmit={handleCreateNotice} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Announcement Title</label>
              <input
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Biometric Server Downtime"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Target Recipients</label>
              <select
                value={target} onChange={(e) => setTarget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="ALL">ALL HOSTELS</option>
                <option value="BUILDING_A">Block A residents</option>
                <option value="BUILDING_B">Block B residents</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block mb-1">Content / Message</label>
              <textarea
                rows={4} required value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Details of scheduling, safety notices, or dining changes..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox" id="emergency" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 bg-slate-100 accent-rose-500 cursor-pointer"
              />
              <label htmlFor="emergency" className="text-xs text-rose-500 font-extrabold select-none cursor-pointer">
                Mark as Emergency Priority
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="py-2.5 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Broadcast Notice ✓
              </button>
            </div>
          </form>
        </NeonModal>
      )}

      {/* 📌 6. VIEW NOTICE POPUP MODAL */}
      {selectedViewNotice && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedViewNotice(null)}
          title={selectedViewNotice.title}
          subtitle={`Published: ${formatDate(selectedViewNotice.createdAt)}`}
          size="md"
          accentColor="purple"
        >
          <div className="space-y-4 text-left font-sans">
            <div>
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                selectedViewNotice.isEmergency ? 'bg-rose-500 text-white' : 'bg-blue-500/15 text-blue-600'
              }`}>
                {selectedViewNotice.isEmergency ? 'EMERGENCY BROADCAST' : `Target: ${selectedViewNotice.target}`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <p className="text-slate-800 dark:text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {selectedViewNotice.content}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedViewNotice(null)}
                className="py-2.5 px-5 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </NeonModal>
      )}

      {/* ⚠️ 7. DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteNotice && (
        <NeonModal
          isOpen={true}
          onClose={() => setShowDeleteModal(false)}
          size="sm"
          accentColor="rose"
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Notice?</h4>
              <p className="text-xs text-rose-500 font-bold mt-0.5">{deleteNotice.title}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">This announcement will be removed from tenant portals.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNotice(deleteNotice.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Delete Notice
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
