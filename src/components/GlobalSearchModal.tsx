'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Users, 
  Building, 
  Wrench, 
  Receipt, 
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const mockQuickLinks = [
    { type: 'Tenant', title: 'Alex Vance (Room 101-A)', desc: 'Rent Due: ₹8,500', href: '/owner/tenants', icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { type: 'Tenant', title: 'Sarah Jenkins (Room 204-B)', desc: 'Status: Active • Paid', href: '/owner/tenants', icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { type: 'Building', title: 'Main Block A - Floor 2', desc: '14/16 Beds Occupied', href: '/owner/buildings', icon: <Building className="w-4 h-4 text-[#1F3A5F] dark:text-[#D4A64A]" /> },
    { type: 'Building', title: 'Executive Tower B - Deluxe', desc: 'Single Sharing AC Rooms', href: '/owner/buildings', icon: <Building className="w-4 h-4 text-[#1F3A5F] dark:text-[#D4A64A]" /> },
    { type: 'Complaint', title: 'T-809: AC Cooling Low in Room 302', desc: 'Urgency: High • Assigned to Warden', href: '/owner/complaints', icon: <Wrench className="w-4 h-4 text-amber-500" /> },
    { type: 'Invoice', title: 'INV-2026-004 (Sarah Jenkins)', desc: 'Verification Pending • ₹8,500', href: '/owner/rent', icon: <Receipt className="w-4 h-4 text-blue-500" /> },
  ];

  const filteredLinks = query.trim() === '' 
    ? mockQuickLinks 
    : mockQuickLinks.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Dialog with Bouncing & Shrinking Spring Entrance */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.4, y: 80, rotateX: 10 }}
            animate={{ opacity: 1, scale: [0.4, 1.05, 0.97, 1], y: [80, -12, 4, 0], rotateX: [10, -2, 0] }}
            exit={{ opacity: 0, scale: 0.45, y: 100, transition: { duration: 0.2, ease: "backIn" } }}
            transition={{ duration: 0.4, times: [0, 0.5, 0.75, 1], ease: "easeInOut" }}
            style={{ willChange: "transform, opacity" }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Header */}
            <div className="flex items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
              <Search className="w-5 h-5 text-[#4F6D9B] dark:text-[#D4A64A] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tenants, rooms, bills, tickets... (Cmd + K)"
                className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
              />
              {query && (
                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <Command className="w-3 h-3" /> ESC
              </kbd>
            </div>

            {/* Results Container */}
            <div className="max-h-[380px] overflow-y-auto p-3 sm:p-4 space-y-2">
              {filteredLinks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                <>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {query ? 'Search Results' : 'Suggested Quick Access'}
                  </div>
                  {filteredLinks.map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelect(item.href)}
                      className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 group-hover:scale-105 transition-transform">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#1F3A5F] dark:group-hover:text-[#D4A64A] transition-colors">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.type}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#1F3A5F] dark:group-hover:text-[#D4A64A] group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Sri Sai Siri Boys Hostel Global Search</span>
              <span>Use <kbd className="font-semibold text-slate-700 dark:text-slate-300">↑</kbd> <kbd className="font-semibold text-slate-700 dark:text-slate-300">↓</kbd> to navigate</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
