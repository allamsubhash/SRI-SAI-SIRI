'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Loader, BellRing, Calendar, Search, X, Sparkles, AlertCircle } from 'lucide-react';
import NeonModal from '@/components/NeonModal';
import { formatDate } from '@/utils/formatters';

export default function TenantAnnouncements() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedViewNotice, setSelectedViewNotice] = useState<any>(null);

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

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch = search === '' || 
        n.title?.toLowerCase().includes(search.toLowerCase()) || 
        n.content?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'ALL' || 
        (filter === 'EMERGENCY' && n.isEmergency) || 
        (filter === 'GENERAL' && !n.isEmergency);
      return matchesSearch && matchesFilter;
    });
  }, [notices, search, filter]);

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
      
      {/* 📢 1. HERO BROADCAST BANNER */}
      <motion.div 
        whileHover={{ y: -3, scale: 1.005 }}
        className="relative p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div className="space-y-2 z-10">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            HOSTEL BULLETIN BROADCAST
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            Warden Announcements
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Stay updated on important hostel schedules, mess dining menus, and maintenance alerts.
          </p>
        </div>
        
        <div className="w-12 h-12 rounded-2xl tenant-bg-accent flex items-center justify-center font-black shadow-lg shrink-0 z-10">
          <Megaphone className="w-6 h-6 animate-pulse" />
        </div>
      </motion.div>

      {/* 🔍 2. SEARCH & CATEGORY FILTERS */}
      <div className="p-4 rounded-[28px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border border-white/80 dark:border-[#293832] shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929B96]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#101916] border border-[#D5D0C7] dark:border-[#30423A] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-[#1C2522] dark:text-[#F2F5F2] focus:outline-none focus:tenant-border-accent"
            placeholder="Search announcements..."
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'All Broadcasts' },
            { id: 'EMERGENCY', label: 'Emergency Alerts' },
            { id: 'GENERAL', label: 'General Notices' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filter === tab.id
                  ? 'tenant-bg-accent shadow-md'
                  : 'bg-[#F1EEE7] dark:bg-[#1A2621] text-[#68736E] dark:text-[#9BAAA4] hover:text-[#1C2522] dark:hover:text-[#F2F5F2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📜 3. ANNOUNCEMENTS CARDS FEED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 rounded-[32px] border border-white/80 dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] italic space-y-2 shadow-xl backdrop-blur-2xl">
            <Megaphone className="w-8 h-8 text-[#929B96] mx-auto opacity-50" />
            <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No announcements found</p>
            <p className="text-[11px]">No hostel broadcasts match your current search filters.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              key={notice.id} 
              onClick={() => setSelectedViewNotice(notice)}
              className={`p-6 rounded-[32px] bg-[#FFFDF9]/95 dark:bg-[#141D19]/95 border shadow-xl backdrop-blur-2xl flex flex-col justify-between space-y-4 cursor-pointer transition-all ${
                notice.isEmergency 
                  ? 'border-rose-300 dark:border-[#F27676]/50 bg-rose-50/50 dark:bg-[#F27676]/5 shadow-[0_0_30px_rgba(244,63,94,0.15)]' 
                  : 'border-white/80 dark:border-[#293832] hover:tenant-border-accent'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className={`px-3 py-1 rounded-full uppercase tracking-wider ${
                  notice.isEmergency 
                    ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border border-rose-200 dark:border-[#F27676]/30 animate-pulse' 
                    : 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
                }`}>
                  {notice.isEmergency ? 'EMERGENCY ALERT' : `TARGET: ${notice.target || 'ALL'}`}
                </span>
                <span className="text-[#68736E] dark:text-[#9BAAA4] font-bold">{formatDate(notice.createdAt)}</span>
              </div>

              <div>
                <h3 className="font-black text-[#1C2522] dark:text-[#F2F5F2] text-base">{notice.title}</h3>
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] leading-relaxed mt-2 line-clamp-3">{notice.content}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <span className="text-[11px] font-black tenant-text-accent hover:underline flex items-center gap-1">
                  Read Announcement →
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 📌 VIEW ANNOUNCEMENT MODAL */}
      {selectedViewNotice && (
        <NeonModal
          isOpen={true}
          onClose={() => setSelectedViewNotice(null)}
          title={selectedViewNotice.title}
          subtitle={`Published on ${formatDate(selectedViewNotice.createdAt)}`}
          size="md"
          accentColor="emerald"
        >
          <div className="space-y-4 text-left font-sans">
            <div>
              <span className={`text-[10px] px-3.5 py-1 rounded-full font-black uppercase tracking-wider ${
                selectedViewNotice.isEmergency ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676]' : 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
              }`}>
                {selectedViewNotice.isEmergency ? 'EMERGENCY' : `Target: ${selectedViewNotice.target || 'All'}`}
              </span>
            </div>

            <div className="p-4.5 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
              <p className="text-[#1C2522] dark:text-[#F2F5F2] text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {selectedViewNotice.content}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedViewNotice(null)}
                className="py-2.5 px-6 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer shadow-md"
              >
                Close Announcement
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </motion.div>
  );
}
