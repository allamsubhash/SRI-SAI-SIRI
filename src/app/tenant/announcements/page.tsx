'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Megaphone, Loader, BellRing, Calendar, Search, X } from 'lucide-react';
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
      <div className="min-h-[50vh] flex items-center justify-center text-[#68736E] dark:text-[#9BAAA4]">
        <Loader className="w-8 h-8 animate-spin tenant-text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-7 page-entrance text-left font-sans transition-colors duration-200">
      
      {/* 📢 1. HERO BANNER */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full tenant-bg-soft tenant-text-accent border tenant-border-accent">
            HOSTEL BULLETIN BROADCAST
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C2522] dark:text-[#F2F5F2] tracking-tight">
            Warden Announcements
          </h1>
          <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] font-medium">
            Stay updated on important hostel schedules, mess dining menus, and maintenance alerts.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl tenant-bg-accent flex items-center justify-center font-black shadow-sm shrink-0">
          <Megaphone className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* 🔍 2. SEARCH & CATEGORY FILTERS */}
      <div className="p-4 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border border-[#DDD8CE] dark:border-[#293832] shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
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
          <div className="col-span-full p-12 text-center bg-[#FFFDF9] dark:bg-[#141D19] rounded-[32px] border border-[#DDD8CE] dark:border-[#293832] text-[#68736E] dark:text-[#9BAAA4] italic space-y-2">
            <Megaphone className="w-8 h-8 text-[#929B96] mx-auto opacity-50" />
            <p className="text-xs font-black text-[#1C2522] dark:text-[#F2F5F2]">No announcements found</p>
            <p className="text-[11px]">No hostel broadcasts match your current search filters.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div 
              key={notice.id} 
              onClick={() => setSelectedViewNotice(notice)}
              className={`p-6 rounded-[28px] bg-[#FFFDF9] dark:bg-[#141D19] border shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 cursor-pointer hover:-translate-y-1 transition-all ${
                notice.isEmergency ? 'border-rose-300 dark:border-[#F27676]/50 bg-rose-50/50 dark:bg-[#F27676]/5' : 'border-[#DDD8CE] dark:border-[#293832] hover:tenant-border-accent'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  notice.isEmergency ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676] border border-rose-200 dark:border-[#F27676]/30' : 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
                }`}>
                  {notice.isEmergency ? 'EMERGENCY ALERT' : `TARGET: ${notice.target || 'ALL'}`}
                </span>
                <span className="text-[#68736E] dark:text-[#9BAAA4]">{formatDate(notice.createdAt)}</span>
              </div>

              <div>
                <h3 className="font-black text-[#1C2522] dark:text-[#F2F5F2] text-base">{notice.title}</h3>
                <p className="text-xs text-[#68736E] dark:text-[#9BAAA4] leading-relaxed mt-2 line-clamp-3">{notice.content}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <span className="text-[11px] font-bold tenant-text-accent hover:underline">Read Announcement →</span>
              </div>
            </div>
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
              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                selectedViewNotice.isEmergency ? 'bg-rose-50 dark:bg-[#F27676]/15 text-[#C94B4B] dark:text-[#F27676]' : 'tenant-bg-soft tenant-text-accent border tenant-border-accent'
              }`}>
                {selectedViewNotice.isEmergency ? 'EMERGENCY' : `Target: ${selectedViewNotice.target || 'All'}`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1EEE7] dark:bg-[#1A2621] border border-[#DDD8CE] dark:border-[#293832]">
              <p className="text-[#1C2522] dark:text-[#F2F5F2] text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {selectedViewNotice.content}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedViewNotice(null)}
                className="py-2.5 px-5 rounded-2xl tenant-bg-accent font-black text-xs cursor-pointer shadow-md"
              >
                Close Announcement
              </button>
            </div>
          </div>
        </NeonModal>
      )}

    </div>
  );
}
